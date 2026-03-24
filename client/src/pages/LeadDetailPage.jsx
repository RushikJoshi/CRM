import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiFileText,
  FiInfo,
  FiClock,
  FiPhone,
  FiMail,
  FiCalendar,
  FiCheckCircle,
  FiMessageSquare,
  FiSend,
  FiUser,
  FiStar,
  FiPaperclip,
  FiSearch,
  FiSmile,
  FiMoreHorizontal,
  FiAtSign,
  FiChevronRight,
  FiChevronLeft,
  FiTarget,
  FiLayers,
  FiX,
  FiFile,
  FiDownload,
} from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";
import LostModal from "../components/LostModal";

// No hardcoded stages - All fetched dynamically

const ACTIVITY_TYPES = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
  { value: "task", label: "Task" },
];

const NEXT_FOLLOW_UP_REGEX = /Next follow-up:\s*(\d{4}-\d{2}-\d{2})/i;

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

function formatDateTime(d) {
  return d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
}

function normalizeStageKey(stage, stages = []) {
  if (!stage) return "New";
  const s = stage.toString();
  // Case-insensitive direct match
  const match = (stages || []).find(x => x.key.toLowerCase() === s.toLowerCase());
  if (match) return match.key;
  
  // Mappings for legacy or variations
  const lower = s.toLowerCase();
  if (lower === "new_lead" || lower === "new inquiry") return "New";
  if (lower === "proposal" || lower === "prospect" || lower === "proposition") return "Proposal";
  if (lower === "negotiation") return "Proposal";
  if (lower === "attempted_contact" || lower === "contacted") return "New";
  return s;
}

function parseNoteAndFollowUp(text) {
  if (!text || typeof text !== "string") return { message: text || "", followUpDate: null };
  const match = text.match(NEXT_FOLLOW_UP_REGEX);
  const followUpDate = match ? match[1] : null;
  const message = match ? text.replace(NEXT_FOLLOW_UP_REGEX, "").trim().replace(/\s*\.\s*$/, "") : text;
  return { message, followUpDate };
}

function getFollowUpBadgeClass(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUp = new Date(d);
  followUp.setHours(0, 0, 0, 0);
  if (followUp < today) return "bg-red-100 text-red-700";
  if (followUp.getTime() === today.getTime()) return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-gray-600";
}

const TIMELINE_TYPE_LABELS = {
  note: "Note",
  call: "Call",
  meeting: "Meeting",
  task: "Task",
  email: "Email",
  message: "Message",
  whatsapp: "WhatsApp",
  lead: "Created",
  lead_stage_changed: "Stage",
  lead_lost: "Lost",
  system: "System",
  deal: "Deal",
};

function formatStageDuration(enteredAt, exitedAt) {
  if (!enteredAt) return null;
  const start = new Date(enteredAt).getTime();
  const end = exitedAt ? new Date(exitedAt).getTime() : Date.now();
  const ms = Math.max(0, end - start);
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}

function getStageDurations(lead) {
  const history = lead?.stageHistory;
  if (!Array.isArray(history) || history.length === 0) return {};
  const now = Date.now();
  const out = {};
  history.forEach((h) => {
    const exit = h.exitedAt ? new Date(h.exitedAt).getTime() : now;
    const label = formatStageDuration(h.enteredAt, h.exitedAt || new Date());
    if (label) out[h.stage] = label;
  });
  return out;
}

function getDateGroupKey(dateStr) {
  if (!dateStr) return "Other";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Other";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dDay = new Date(d);
  dDay.setHours(0, 0, 0, 0);
  if (dDay.getTime() === today.getTime()) return "Today";
  if (dDay.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function groupActivitiesByDate(activities) {
  const groups = {};
  (activities || []).forEach((item) => {
    const key = getDateGroupKey(item.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  const order = ["Today", "Yesterday"];
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
  });
  return sortedKeys.map((k) => ({ label: k, items: groups[k] }));
}

function ActivityItem({ item, isLast }) {
  const label = TIMELINE_TYPE_LABELS[item.type] || item.type || "Activity";
  const date = item.date ? new Date(item.date) : null;
  const timeStr = date && !Number.isNaN(date.getTime())
    ? date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    : "—";
  const displayMessage = item.note ?? item.title ?? "";
  const { message, followUpDate } = parseNoteAndFollowUp(displayMessage);

  const name = (item.user || "System").toString();
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

  return (
    <div className="relative flex -ml-10">
      {/* Avatar on the vertical line (overlaps into left padding so it sits on the line) */}
      <div className="w-8 shrink-0 flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 shadow-sm z-[1]">
          {initials}
        </div>
        {!isLast && <div className="w-0.5 flex-1 min-h-[12px] bg-gray-200" />}
      </div>
      <div className="flex-1 min-w-0 pl-4 pb-5">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">{name}</span>
          <span className="text-xs text-gray-400">{timeStr}</span>
        </div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">{label}</p>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mt-1">{message || "—"}</p>
        {followUpDate && (
          <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${getFollowUpBadgeClass(followUpDate)}`}>
            <FiClock size={10} />
            Next activity: {formatDate(followUpDate)}
          </div>
        )}
        {item.attachments && item.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {item.attachments.map((file, idx) => (
              <a
                key={idx}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 hover:border-teal-300 hover:bg-teal-50"
              >
                <FiFile size={12} />
                <span className="truncate max-w-[100px]">{file.name}</span>
                <FiDownload size={10} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const StageBreadcrumbs = ({ stages, currentStage, onUpdate, updating }) => {
  const currentIndex = stages.findIndex(s => s.key.toLowerCase() === (currentStage || "").toLowerCase());
  
  return (
    <div className="flex items-center bg-gray-100/50 border border-gray-200 rounded-md overflow-hidden">
      {stages.map((s, idx) => {
        const isCurrent = s.key.toLowerCase() === (currentStage || "").toLowerCase();
        const isPast = currentIndex > idx;
        const isWon = s.key.toLowerCase() === 'won';
        
        return (
          <button
            key={s.key}
            onClick={() => !isWon && onUpdate(s.key)}
            disabled={updating || (isWon && !isCurrent)}
            className={`
              relative h-8 px-5 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center
              ${isCurrent ? 'bg-teal-600 text-white z-10' : isPast ? 'bg-white text-gray-900 border-r border-gray-200' : 'bg-transparent text-gray-400'}
              ${idx !== 0 ? 'pl-7' : ''}
              ${idx !== stages.length - 1 ? 'pr-8' : ''}
            `}
            style={{
               clipPath: idx === 0 
                ? 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)'
                : idx === stages.length - 1
                ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 10% 50%)'
                : 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%)',
               marginLeft: idx === 0 ? '0' : '-18px'
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
};

const EnrichmentCard = ({ lead }) => {
  if (!lead?.companyName && !lead?.email) return null;
  
  const initials = (lead.companyName || lead.name || "G").charAt(0).toUpperCase();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 mt-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center text-white text-2xl font-black shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{lead.companyName || lead.name}</h3>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            {lead.companyName ? `${lead.companyName} specializes in providing industry-leading solutions in ${lead.industry || 'their sector'}$.` : 'No additional company description available.'}
          </p>
        </div>
        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${lead.companyName || lead.name}`} className="w-12 h-12 rounded-lg opacity-20" alt="logo" />
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
        <div className="flex items-start gap-4">
          <FiCalendar className="mt-0.5 text-gray-400" size={16} />
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Type</p>
            <p className="text-sm text-gray-700 font-medium">{lead.source || 'Lead'}</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <FiTarget className="mt-0.5 text-gray-400" size={16} />
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Industry</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 text-[10px] font-bold rounded-full">
                {lead.industry || 'General'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <FiClock className="mt-0.5 text-gray-400" size={16} />
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Location</p>
            <p className="text-sm text-gray-700 font-medium">{lead.location || lead.city || 'Not specified'}</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <FiLayers className="mt-0.5 text-gray-400" size={16} />
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Course/Interest</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                {lead.course || 'CRM'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatterTab, setChatterTab] = useState("conversation");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [noteMentionedUserId, setNoteMentionedUserId] = useState("");
  const [messageMentionedUserId, setMessageMentionedUserId] = useState("");
  const [activityMentionedUserId, setActivityMentionedUserId] = useState("");
  const [activityType, setActivityType] = useState("note");
  const [activityNote, setActivityNote] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [savingActivity, setSavingActivity] = useState(false);
  const [pipeline, setPipeline] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [savingMessage, setSavingMessage] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [activeTab, setActiveTab] = useState("notes"); // lead detail info tabs
  const [showLost, setShowLost] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);

  const fetchPipeline = useCallback(async () => {
    try {
      // ONE PIPELINE PER COMPANY — single object response
      const res = await API.get("/pipeline");
      const data = res.data?.data || null;
      setPipeline(data);
    } catch (err) {
      console.error("PIPELINE FETCH ERROR (LeadDetail):", err);
    }
  }, []);
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingSection, setEditingSection] = useState(null); // 'company', 'marketing', 'job', 'location'
  const [editedLead, setEditedLead] = useState({});
  const fileInputRef = React.useRef(null);
  const tagDropdownRef = React.useRef(null);
  const emojiPickerRef = React.useRef(null);

  useEffect(() => {
    const closeOverlay = (e) => {
      if (showTagDropdown && tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) setShowTagDropdown(false);
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", closeOverlay);
    return () => document.removeEventListener("mousedown", closeOverlay);
  }, [showTagDropdown, showEmojiPicker]);

  const addEmoji = (emoji) => {
    if (chatterTab === "send_message") {
      setMessageText(prev => prev + emoji);
    } else if (chatterTab === "log_note") {
      setNoteText(prev => prev + emoji);
    } else {
      setActivityNote(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const commonEmojis = ["😊", "👍", "🔥", "✅", "❌", "📞", "📅", "✉️", "🙌", "💡", "💰", "🚀"];

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await API.post("/uploads/single", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachments(prev => [...prev, { name: res.data.data.name, url: res.data.data.url }]);
      toast.success("File uploaded.");
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const openFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const selectTaggedUser = (user) => {
    const mention = `@${user.name}`;
    if (chatterTab === "send_message") {
      setMessageMentionedUserId(user._id);
      setMessageText((prev) => (prev ? `${prev} ${mention}` : mention));
    } else if (chatterTab === "log_note") {
      setNoteMentionedUserId(user._id);
      setNoteText((prev) => (prev ? `${prev} ${mention}` : mention));
    } else {
      setActivityMentionedUserId(user._id);
      setActivityNote((prev) => (prev ? `${prev} ${mention}` : mention));
    }
    setShowTagDropdown(false);
  };

  const fetchLead = useCallback(async () => {
    if (!id) return;
    try {
      const res = await API.get(`/leads/${id}`);
      const data = res.data?.data || res.data;
      setLead(data);
      setEditedLead(data);
      setEmailTo(data.email || "");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load lead.");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const saveDetails = async (section) => {
    try {
      setLoading(true);
      const res = await API.patch(`/leads/${id}`, editedLead);
      setLead(res.data?.data || res.data);
      setEditingSection(null);
      toast.success("Details updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field, val) => {
    setEditedLead(prev => ({ ...prev, [field]: val }));
  };

  const fetchTimeline = useCallback(async () => {
    if (!id) return;
    setActivityLoading(true);
    try {
      const res = await API.get(`/activities/timeline?leadId=${id}`);
      setActivities(res.data?.data || []);
    } catch {
      setActivities([]);
    } finally {
      setActivityLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchLead();
    fetchPipeline();
  }, [fetchLead, fetchPipeline]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  useEffect(() => {
    const userRole = getCurrentUser()?.role;
    if (userRole === "sales" || userRole === "support" || userRole === "marketing") {
       // Only fetch if necessary or let it happen since backend is now open.
       // Actually, we'll keep it but it's safe now.
    }
    (async () => {
      try {
        const res = await API.get("/users?limit=500");
        const data = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        setUsers([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (chatterTab === "email") {
      (async () => {
        try {
          const res = await API.get("/email/templates");
          setEmailTemplates(res.data?.data || []);
        } catch (err) {
          console.error("TEMPLATE FETCH ERROR:", err);
        }
      })();
    }
  }, [chatterTab]);

  const onSelectTemplate = (id) => {
    setSelectedTemplate(id);
    const t = emailTemplates.find(x => x._id === id);
    if (t) {
      setEmailSubject(t.subject);
      setEmailBody(t.body);
    } else {
      setEmailSubject("");
      setEmailBody("");
    }
  };

  const onSendEmail = async (e) => {
    e.preventDefault();
    if (!emailBody.trim() || !id) return;
    setSendingEmail(true);
    try {
      await API.post("/email/send", {
        to: emailTo,
        leadId: id,
        templateId: selectedTemplate || undefined,
        subject: emailSubject,
        body: emailBody,
      });
      toast.success("Email sent!");
      setEmailSubject("");
      setEmailBody("");
      setSelectedTemplate("");
      setChatterTab("log_note");
      fetchTimeline();
      fetchLead(); // Refresh score
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const updateStage = async (stageKey) => {
    if (!lead?._id) return;
    setUpdatingStage(true);
    try {
      const res = await API.patch(`/leads/${id}/stage`, { status: stageKey });
      setLead(res.data?.data || res.data);
      fetchTimeline();
      toast.success("Stage updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stage.");
    } finally {
      setUpdatingStage(false);
    }
  };

  const convertLead = async () => {
    try {
      await API.post(`/leads/${id}/convert`);
      toast.success("Lead converted.");
      fetchLead();
      fetchTimeline();
    } catch (err) {
      toast.error(err.response?.data?.message || "Convert failed.");
    }
  };

  const markLost = async ({ reason, notes }) => {
    setMarkingLost(true);
    try {
      const res = await API.post(`/leads/${id}/lost`, { reason, notes });
      setLead(res.data?.data || res.data);
      setShowLost(false);
      fetchTimeline();
      toast.success("Lead marked as Lost.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as lost.");
    } finally {
      setMarkingLost(false);
    }
  };

  const logNote = async (e) => {
    e.preventDefault();
    const description = (noteText || "").trim();
    if (!description || !id) return;
    setSavingNote(true);
    try {
      await API.post("/activities", {
        leadId: id,
        type: "note",
        note: description,
        title: (noteTitle || "").trim() || undefined,
        mentionedUserId: noteMentionedUserId || undefined,
        attachments: attachments,
      });
      setNoteTitle("");
      setNoteText("");
      setNoteMentionedUserId("");
      setAttachments([]);
      toast.success("Note saved.");
      fetchTimeline();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save note.");
    } finally {
      setSavingNote(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = (messageText || "").trim();
    if (!text || !id) return;
    setSavingMessage(true);
    try {
      await API.post("/activities", {
        leadId: id,
        type: "message",
        note: text,
        mentionedUserId: messageMentionedUserId || undefined,
        attachments: attachments,
      });
      setMessageText("");
      setMessageMentionedUserId("");
      setAttachments([]);
      toast.success("Message logged.");
      fetchTimeline();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSavingMessage(false);
    }
  };

  const addActivity = async (e) => {
    e.preventDefault();
    const note = (activityNote || "").trim();
    if (!note || !id) return;
    setSavingActivity(true);
    try {
      const notePayload = nextFollowUpDate ? `${note}. Next follow-up: ${nextFollowUpDate}` : note;
      await API.post("/activities", {
        leadId: id,
        type: activityType,
        note: notePayload,
        mentionedUserId: activityMentionedUserId || undefined,
        attachments: attachments,
      });
      setActivityNote("");
      setNextFollowUpDate("");
      setActivityMentionedUserId("");
      setAttachments([]);
      toast.success("Activity added.");
      fetchTimeline();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add activity.");
    } finally {
      setSavingActivity(false);
    }
  };

  const markWon = () => updateStage("won");

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
          <FiArrowLeft size={18} /> Back
        </button>
        <p className="mt-4 text-gray-500">Lead not found.</p>
      </div>
    );
  }

  const navStages = pipeline?.stages?.length > 0 ? pipeline.stages.map(s => ({ key: s.name, label: s.name })) : [];
  const currentStageKey = normalizeStageKey(lead.stage, navStages);
  const statusNorm = String(lead?.status || "Open").trim();
  const isLost = statusNorm === "Lost";
  const isWon = statusNorm === "Won";
  const priorityStars = lead?.priorityStars || 0;
  const expectedRevenue = lead?.expectedRevenue ?? lead?.value ?? 0;
  const probability = lead?.probability ?? 10;
  const stageDurations = getStageDurations(lead);

  const salesperson = lead?.assignedTo?.name || "Unassigned";
  const expectedClosing = lead?.wonAt || lead?.updatedAt || null;
  const leadTags = [lead?.source, lead?.course].filter(Boolean);
  return (
    <div className="bg-[#f3f4f6] min-h-full">
      <div className="w-full bg-white shadow-sm flex flex-col">
        {/* Status Header */}
        <div className="px-4 md:px-6 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between bg-white relative gap-4">
          <div className="flex items-center gap-3">
             <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200">
               <FiArrowLeft size={18} className="text-gray-600" />
             </button>
             <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded border ${isWon ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isLost ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {statusNorm.toUpperCase()}
                </span>
                <div className="hidden sm:flex items-center text-xs font-bold text-gray-400">
                  <span>Pipeline</span>
                  <FiChevronRight size={14} />
                  <span className="text-gray-900 truncate max-w-[150px]">{lead.name || "Opportunity"}</span>
                  <FiChevronRight size={14} />
                  <span className="text-indigo-600 font-black uppercase tracking-widest text-[10px] ml-1">Assigned to: {salesperson}</span>
                  <span className="ml-4 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    Score: {lead.score || 0} 🔥
                  </span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               {!isWon && !isLost && (
                 <>
                   <button 
                    onClick={() => markWon()}
                    disabled={updatingStage}
                    className="hidden md:block px-4 py-1.5 bg-emerald-600 text-white text-[11px] font-bold uppercase rounded-md shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                   >
                     Won
                   </button>
                   <button 
                    onClick={() => setShowLost(true)}
                    className="hidden md:block px-4 py-1.5 bg-white border border-gray-200 text-gray-700 text-[11px] font-bold uppercase rounded-md hover:bg-gray-50"
                   >
                     Lost
                   </button>
                 </>
               )}
               <button 
                onClick={() => setShowEnrichment(!showEnrichment)}
                className={`px-4 py-1.5 border text-[11px] font-bold uppercase rounded-md transition-all ${showEnrichment ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
               >
                 Enrich
               </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="max-w-[400px] overflow-x-auto no-scrollbar">
                <StageBreadcrumbs 
                  stages={pipeline?.stages?.length > 0 ? pipeline.stages.map(s => ({ key: s.name, label: s.name })) : []} 
                  currentStage={currentStageKey} 
                  onUpdate={updateStage} 
                  updating={updatingStage} 
                />
              </div>
              <div className="hidden lg:flex items-center ml-2 text-gray-400 gap-1 text-sm border-l pl-4 border-gray-200">
                 <span className="font-bold text-gray-900 shrink-0">1 / 1</span>
                <button className="p-1 hover:text-gray-900"><FiChevronLeft size={20} /></button>
                <button className="p-1 hover:text-gray-900"><FiChevronRight size={20} /></button>
              </div>
            </div>
          </div>

        </div>

        <div className="flex-1 flex flex-col xl:flex-row">
          {/* Main Content (Left) */}
          <div className="flex-1 p-8 border-r border-gray-100">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight break-words">{lead.name || "Opportunity"}{"'s opportunity"}</h1>
               <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 font-medium">
                <FiUser size={14} className="text-indigo-400" />
                <span>Working on this: <span className="text-indigo-600 font-black uppercase tracking-widest text-[11px]">{salesperson}</span></span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-amber-400">
                {[1, 2, 3].map((star) => (
                  <button 
                    key={star} 
                    className="transition-transform hover:scale-110 active:scale-95"
                    onClick={() => API.patch(`/leads/${id}`, { priorityStars: star }).then(fetchLead)}
                  >
                    <FiStar size={20} fill={star <= priorityStars ? "currentColor" : "none"} stroke="currentColor" className={star <= priorityStars ? "text-amber-400" : "text-gray-200"} />
                  </button>
                 ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* Left Grid */}
              <div className="space-y-4">
                <div className="flex items-center group">
                  <label className="w-1/3 text-sm font-bold text-gray-900">Expected Revenue</label>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">₹ {Number(expectedRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="flex items-center group">
                  <label className="w-1/3 text-sm font-bold text-gray-900">Probability</label>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm text-gray-500">at</span>
                    <span className="text-sm font-black text-gray-900">{probability.toFixed(2)} %</span>
                  </div>
                </div>
                
                <div className="pt-6 space-y-4 border-t border-gray-50">
                  <div className="flex items-center">
                    <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Contact</label>
                    <span className="flex-1 text-sm font-bold text-teal-600 hover:underline cursor-pointer">{lead.name}</span>
                  </div>
                  <div className="flex items-center">
                    <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Email</label>
                    <span className="flex-1 text-sm text-teal-600 hover:underline cursor-pointer">{lead.email || "—"}</span>
                  </div>
                  <div className="flex items-center">
                    <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Phone</label>
                    <span className="flex-1 text-sm text-gray-700">{lead.phone || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Right Grid */}
              <div className="space-y-4 border-l pl-12 border-gray-50">
                <div className="flex items-center">
                  <label className="w-1/3 text-sm font-bold text-gray-900">Assigned To</label>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-indigo-50 text-[10px] flex items-center justify-center font-black text-indigo-600 border border-indigo-100">{salesperson.charAt(0)}</div>
                    <span className="text-sm font-bold text-gray-800 uppercase tracking-tight">{salesperson}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <label className="w-1/3 text-sm font-bold text-gray-900">Expected Closing</label>
                  <span className="flex-1 text-sm text-gray-400 italic">{formatDate(expectedClosing) === "—" ? "No closing estimate" : formatDate(expectedClosing)}</span>
                </div>
                <div className="flex items-center">
                  <label className="w-1/3 text-sm font-bold text-gray-900">Tags</label>
                  <div className="flex-1 flex flex-wrap gap-1">
                    {leadTags.length > 0 ? leadTags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded">{t}</span>
                    )) : <span className="text-gray-400 text-xs italic">No tags</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="mt-12 border-b border-gray-200 flex items-center gap-8">
               <button 
                onClick={() => setActiveTab('notes')}
                className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'notes' ? 'text-teal-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-teal-600' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 Notes
               </button>
               <button 
                onClick={() => setActiveTab('extra')}
                className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'extra' ? 'text-teal-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-teal-600' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 Extra Info
               </button>
            </div>

            <div className="py-6">
              {activeTab === 'notes' && (
                <div className="group">
                  <textarea 
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a description..."
                    className="w-full min-h-[100px] text-sm text-gray-700 placeholder-gray-400 bg-transparent border-none focus:ring-0 resize-none"
                  />
                    <div className="mt-2 flex justify-end">
                       <button 
                        onClick={(e) => logNote(e)}
                        disabled={savingNote || !noteText.trim()}
                        className="px-4 py-1.5 bg-teal-600 text-white text-xs font-bold rounded shadow-sm hover:bg-teal-700 disabled:opacity-50"
                       >
                         {savingNote ? 'Saving...' : 'Save Note'}
                       </button>
                    </div>
                </div>
              )}
              {activeTab === 'extra' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* SECTION: COMPANY & MARKETING */}
                    <div className="space-y-6">
                      <div className="group/sec">
                        <div className="flex items-center justify-between border-b pb-1 mb-4">
                           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Company Detail</h4>
                           {editingSection === 'company' ? (
                             <div className="flex gap-2">
                               <button onClick={() => saveDetails('company')} className="text-[10px] font-bold text-teal-600 hover:bg-teal-50 px-2 py-0.5 rounded">SAVE</button>
                               <button onClick={() => { setEditingSection(null); setEditedLead(lead); }} className="text-[10px] font-bold text-gray-400 hover:bg-gray-50 px-2 py-0.5 rounded">CANCEL</button>
                             </div>
                           ) : (
                             <button onClick={() => setEditingSection('company')} className="text-[10px] font-bold text-teal-600 opacity-0 group-hover/sec:opacity-100 transition-opacity">EDIT</button>
                           )}
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Company</label>
                             {editingSection === 'company' ? (
                               <input value={editedLead.companyName || ""} onChange={(e) => handleEditChange('companyName', e.target.value)} className="flex-1 text-sm border-b border-teal-200 outline-none focus:border-teal-500 bg-transparent" />
                             ) : (
                               <span className="flex-1 text-sm text-gray-700">{lead.companyName || "—"}</span>
                             )}
                           </div>
                           <div className="flex items-center">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Website</label>
                             {editingSection === 'company' ? (
                               <input value={editedLead.website || ""} onChange={(e) => handleEditChange('website', e.target.value)} className="flex-1 text-sm border-b border-teal-200 outline-none focus:border-teal-500 bg-transparent" />
                             ) : (
                               <span className="flex-1 text-sm text-teal-600 hover:underline cursor-pointer">{lead.website || "—"}</span>
                             )}
                           </div>
                           <div className="flex items-center">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Industry</label>
                             {editingSection === 'company' ? (
                               <input value={editedLead.industry || ""} onChange={(e) => handleEditChange('industry', e.target.value)} className="flex-1 text-sm border-b border-teal-200 outline-none focus:border-teal-500 bg-transparent" />
                             ) : (
                               <span className="flex-1 text-sm text-gray-700">{lead.industry || "—"}</span>
                             )}
                           </div>
                           <div className="flex items-center">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Size</label>
                             {editingSection === 'company' ? (
                               <input value={editedLead.companySize || ""} onChange={(e) => handleEditChange('companySize', e.target.value)} className="flex-1 text-sm border-b border-teal-200 outline-none focus:border-teal-500 bg-transparent" />
                             ) : (
                               <span className="flex-1 text-sm text-gray-700">{lead.companySize || "—"}</span>
                             )}
                           </div>
                        </div>
                      </div>

                      <div className="group/sec">
                        <div className="flex items-center justify-between border-b pb-1 mb-4">
                           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Marketing</h4>
                           {editingSection === 'marketing' ? (
                             <div className="flex gap-2">
                               <button onClick={() => saveDetails('marketing')} className="text-[10px] font-bold text-teal-600 hover:bg-teal-50 px-2 py-0.5 rounded">SAVE</button>
                               <button onClick={() => { setEditingSection(null); setEditedLead(lead); }} className="text-[10px] font-bold text-gray-400 hover:bg-gray-50 px-2 py-0.5 rounded">CANCEL</button>
                             </div>
                           ) : (
                             <button onClick={() => setEditingSection('marketing')} className="text-[10px] font-bold text-teal-600 opacity-0 group-hover/sec:opacity-100 transition-opacity">EDIT</button>
                           )}
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Source</label>
                             {editingSection === 'marketing' ? (
                               <input value={editedLead.source || ""} onChange={(e) => handleEditChange('source', e.target.value)} className="flex-1 text-sm border-b border-teal-200 outline-none focus:border-teal-500 bg-transparent" />
                             ) : (
                               <span className="flex-1 text-sm text-gray-700">{lead.source || "—"}</span>
                             )}
                           </div>
                           <div className="flex items-center">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Referred</label>
                             {editingSection === 'marketing' ? (
                               <input value={editedLead.referredBy || ""} onChange={(e) => handleEditChange('referredBy', e.target.value)} className="flex-1 text-sm border-b border-teal-200 outline-none focus:border-teal-500 bg-transparent" />
                             ) : (
                               <span className="flex-1 text-sm text-gray-700">{lead.referredBy || "—"}</span>
                             )}
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION: CONTACT & POSITION */}
                    <div className="space-y-6">
                      <div className="group/sec">
                        <div className="flex items-center justify-between border-b pb-1 mb-4">
                           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Job & Contact</h4>
                           {editingSection === 'job' ? (
                             <div className="flex gap-2">
                               <button onClick={() => saveDetails('job')} className="text-[10px] font-bold text-teal-600 hover:bg-teal-50 px-2 py-0.5 rounded">SAVE</button>
                               <button onClick={() => { setEditingSection(null); setEditedLead(lead); }} className="text-[10px] font-bold text-gray-400 hover:bg-gray-50 px-2 py-0.5 rounded">CANCEL</button>
                             </div>
                           ) : (
                             <button onClick={() => setEditingSection('job')} className="text-[10px] font-bold text-teal-600 opacity-0 group-hover/sec:opacity-100 transition-opacity">EDIT</button>
                           )}
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Job Title</label>
                             {editingSection === 'job' ? (
                               <input value={editedLead.jobTitle || ""} onChange={(e) => handleEditChange('jobTitle', e.target.value)} className="flex-1 text-sm border-b border-teal-200 outline-none focus:border-teal-500 bg-transparent" />
                             ) : (
                               <span className="flex-1 text-sm text-gray-700">{lead.jobTitle || "—"}</span>
                             )}
                           </div>
                           <div className="flex items-center">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Alt Phone</label>
                             {editingSection === 'job' ? (
                               <input value={editedLead.alternatePhone || ""} onChange={(e) => handleEditChange('alternatePhone', e.target.value)} className="flex-1 text-sm border-b border-teal-200 outline-none focus:border-teal-500 bg-transparent" />
                             ) : (
                               <span className="flex-1 text-sm text-gray-700">{lead.alternatePhone || "—"}</span>
                             )}
                           </div>
                           <div className="flex items-center">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Sec. Email</label>
                             {editingSection === 'job' ? (
                               <input value={editedLead.secondaryEmail || ""} onChange={(e) => handleEditChange('secondaryEmail', e.target.value)} className="flex-1 text-sm border-b border-teal-200 outline-none focus:border-teal-500 bg-transparent" />
                             ) : (
                               <span className="flex-1 text-sm text-gray-700">{lead.secondaryEmail || "—"}</span>
                             )}
                           </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 border-b pb-1">System Info</h4>
                        <div className="space-y-4">
                           <div className="flex">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Created By</label>
                             <span className="flex-1 text-sm text-gray-700">{lead.createdBy?.name || "System"}</span>
                           </div>
                           <div className="flex">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Created At</label>
                             <span className="flex-1 text-[11px] text-gray-500">{formatDateTime(lead.createdAt)}</span>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION: LOCATION */}
                    <div className="group/sec">
                      <div className="flex items-center justify-between border-b pb-1 mb-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Location Address</h4>
                        {editingSection === 'location' ? (
                          <div className="flex gap-2">
                             <button onClick={() => saveDetails('location')} className="text-[10px] font-bold text-teal-600 hover:bg-teal-50 px-2 py-0.5 rounded">SAVE</button>
                             <button onClick={() => { setEditingSection(null); setEditedLead(lead); }} className="text-[10px] font-bold text-gray-400 hover:bg-gray-50 px-2 py-0.5 rounded">CANCEL</button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingSection('location')} className="text-[10px] font-bold text-teal-600 opacity-0 group-hover/sec:opacity-100 transition-opacity">EDIT</button>
                        )}
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-start">
                           <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Address</label>
                           {editingSection === 'location' ? (
                             <textarea value={editedLead.address || ""} onChange={(e) => handleEditChange('address', e.target.value)} className="flex-1 text-sm border border-teal-100 rounded p-1 outline-none focus:border-teal-500 bg-teal-50/10 min-h-[60px]" />
                           ) : (
                             <span className="flex-1 text-sm text-gray-700 whitespace-pre-wrap">{lead.address || "—"}</span>
                           )}
                         </div>
                         <div className="flex items-center">
                           <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">City</label>
                           {editingSection === 'location' ? (
                             <input value={editedLead.location || editedLead.city || ""} onChange={(e) => handleEditChange('location', e.target.value)} className="flex-1 text-sm border-b border-teal-200 outline-none focus:border-teal-500 bg-transparent" />
                           ) : (
                             <span className="flex-1 text-sm text-gray-700">{lead.location || lead.city || "—"}</span>
                           )}
                         </div>
                         <div className="flex items-center">
                           <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">State</label>
                           {editingSection === 'location' ? (
                             <input value={editedLead.state || ""} onChange={(e) => handleEditChange('state', e.target.value)} className="flex-1 text-sm border-b border-teal-200 outline-none focus:border-teal-500 bg-transparent" />
                           ) : (
                             <span className="flex-1 text-sm text-gray-700">{lead.state || "—"}</span>
                           )}
                         </div>
                         <div className="flex items-center">
                           <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Country</label>
                           {editingSection === 'location' ? (
                             <input value={editedLead.country || ""} onChange={(e) => handleEditChange('country', e.target.value)} className="flex-1 text-sm border-b border-teal-200 outline-none focus:border-teal-500 bg-transparent" />
                           ) : (
                             <span className="flex-1 text-sm text-gray-700">{lead.country || "—"}</span>
                           )}
                         </div>
                         <div className="flex items-center">
                           <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Zip Code</label>
                           {editingSection === 'location' ? (
                             <input value={editedLead.zipCode || ""} onChange={(e) => handleEditChange('zipCode', e.target.value)} className="flex-1 text-sm border-b border-teal-200 outline-none focus:border-teal-500 bg-transparent" />
                           ) : (
                             <span className="flex-1 text-sm text-gray-700">{lead.zipCode || "—"}</span>
                           )}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CHATTER SECTION (Right / Bottom) */}
          <div className="w-full xl:w-[600px] bg-white flex flex-col border-l border-gray-100 h-screen sticky top-0">
             {/* Tab Switcher */}
             <div className="px-6 py-4 border-b border-gray-100 bg-white z-20 shadow-sm flex items-center justify-between">
                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                   {['conversation', 'notes', 'activity', 'emails'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setChatterTab(tab)}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all whitespace-nowrap ${
                           chatterTab === tab 
                           ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                           : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                         {tab}
                      </button>
                   ))}
                </div>
                <div className="flex items-center gap-2 text-gray-400 pl-4 border-l border-gray-100">
                    <button type="button" onClick={openFileInput} className="hover:text-teal-600"><FiPaperclip size={16} /></button>
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="hover:text-amber-500"><FiSmile size={16} /></button>
                </div>
             </div>

             {/* Feed Area */}
             <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 flex flex-col-reverse relative min-h-0">
                {activityLoading ? (
                  <div className="h-full flex items-center justify-center py-20">
                     <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (() => {
                   const filtered = activities.filter(item => {
                      if (chatterTab === 'conversation') return ['email', 'message', 'whatsapp'].includes(item.type);
                      if (chatterTab === 'notes') return item.type === 'note';
                      if (chatterTab === 'activity') return ['lead_stage_changed', 'system', 'lead_assignment_changed', 'lead', 'deal_stage_changed'].includes(item.type);
                      if (chatterTab === 'emails') return item.type === 'email';
                      return false;
                   });

                   if (filtered.length === 0) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-20 px-8">
                           <FiMessageSquare size={64} className="text-gray-200 mb-4" />
                           <p className="text-sm font-black uppercase tracking-widest text-gray-400">No {chatterTab} history yet</p>
                        </div>
                      );
                   }

                   // Chat sort: Ascending by time if it's conversation
                   const sorted = chatterTab === 'conversation' 
                     ? [...filtered].sort((a,b) => new Date(a.date) - new Date(b.date))
                     : [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date));

                   return (
                     <div className={`flex flex-col gap-4`}>
                        {groupActivitiesByDate(sorted).map((group) => (
                           <div key={group.label} className="mt-4 first:mt-0">
                              <div className="flex items-center justify-center my-6 sticky top-0 z-10">
                                 <span className="px-3 py-1 bg-white border border-gray-100 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 rounded-full shadow-sm">
                                    {group.label}
                                 </span>
                              </div>
                              <div className="space-y-4">
                                 {group.items.map((item, idx) => {
                                    const isSelf = true; // Assuming internal messages are outgoing for now
                                    if (chatterTab === 'conversation') {
                                       return (
                                          <div key={item._id || idx} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} animate-in slide-in-from-${isSelf ? 'right' : 'left'}-4 duration-300`}>
                                             <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative group ${isSelf ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                   <span className={`text-[10px] font-bold ${isSelf ? 'text-indigo-100' : 'text-gray-400'}`}>{(item.user || 'User').split(' ')[0]}</span>
                                                   <span className={`text-[9px] ${isSelf ? 'text-indigo-200 /80' : 'text-gray-300'}`}>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="text-sm leading-relaxed whitespace-pre-wrap">{parseNoteAndFollowUp(item.note || item.title).message}</div>
                                                {item.type === 'email' && (
                                                   <div className={`mt-2 pt-2 border-t text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${isSelf ? 'border-indigo-500 text-indigo-200' : 'border-gray-50 text-teal-600'}`}>
                                                      <FiMail size={12} /> Email sent to recipient
                                                   </div>
                                                )}
                                                {isSelf && (
                                                   <div className="absolute -left-12 bottom-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-indigo-400 font-black text-[9px]">
                                                      READ <FiCheckCircle size={10} className="text-indigo-600" />
                                                   </div>
                                                )}
                                             </div>
                                          </div>
                                       );
                                    }
                                    return <ActivityItem key={item._id || idx} item={item} isLast={idx === group.items.length - 1} />;
                                 })}
                              </div>
                           </div>
                        ))}
                     </div>
                   );
                })()}
             </div>

             {/* Sticky Input Area */}
             <div className="p-6 border-t border-gray-100 bg-white">
                {chatterTab === 'conversation' && (
                   <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                         <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-1.5">
                            <FiMessageSquare size={10} /> Mode: Message
                         </div>
                         <div className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-teal-100 cursor-pointer hover:bg-teal-100 transition-all" onClick={() => setChatterTab('emails')}>
                            Switch to full email
                         </div>
                      </div>
                      <div className="relative group">
                         <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Type a message to recipient..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all min-h-[50px] max-h-[150px] resize-none pr-12 shadow-inner"
                            onKeyDown={(e) => {
                               if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  sendMessage(e);
                               }
                            }}
                         />
                         <button
                            onClick={sendMessage}
                            disabled={savingMessage || !messageText.trim()}
                            className="absolute right-3 bottom-3 p-2 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-30 transition-all active:scale-90"
                         >
                            <FiSend size={18} />
                         </button>
                      </div>
                   </div>
                )}

                {chatterTab === 'notes' && (
                   <div className="space-y-4">
                      <textarea
                         value={noteText}
                         onChange={(e) => setNoteText(e.target.value)}
                         placeholder="Add an internal note for your team..."
                         className="w-full bg-amber-50/20 border border-amber-200/50 rounded-xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all min-h-[100px]"
                      />
                      <div className="flex justify-end">
                         <button
                            onClick={logNote}
                            disabled={savingNote || !noteText.trim()}
                            className="px-6 py-2 bg-amber-500 text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all"
                         >
                            POST INTERNAL NOTE
                         </button>
                      </div>
                   </div>
                )}

                {chatterTab === 'emails' && (
                   <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
                      <div className="grid grid-cols-1 gap-4">
                          <input 
                              placeholder="To: (Enter email)"
                              value={emailTo}
                              onChange={e => setEmailTo(e.target.value)}
                              className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold"
                          />
                          <select 
                            value={selectedTemplate}
                            onChange={e => onSelectTemplate(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold"
                          >
                             <option value="">Select a template...</option>
                             {emailTemplates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                          </select>
                          <input 
                              placeholder="Subject"
                              value={emailSubject}
                              onChange={e => setEmailSubject(e.target.value)}
                              className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold"
                          />
                          <textarea
                             value={emailBody}
                             onChange={(e) => setEmailBody(e.target.value)}
                             placeholder="Write full email here..."
                             className="w-full bg-white border border-gray-100 rounded-lg p-3 text-sm min-h-[120px]"
                          />
                      </div>
                      <div className="flex justify-end pt-2">
                         <button
                            onClick={onSendEmail}
                            disabled={sendingEmail || !emailBody.trim()}
                            className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg hover:bg-indigo-700 shadow-indigo-100 transition-all"
                         >
                            {sendingEmail ? 'Sending...' : 'SEND TRACKED EMAIL'} <FiMail size={14} />
                         </button>
                      </div>
                   </div>
                )}

                {chatterTab === 'activity' && (
                   <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-3">
                         <select
                            value={activityType}
                            onChange={e => setActivityType(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                         >
                            {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                         </select>
                         <input
                            type="date"
                            value={nextFollowUpDate}
                            onChange={e => setNextFollowUpDate(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                         />
                      </div>
                      <div className="relative">
                         <textarea
                            value={activityNote}
                            onChange={e => setActivityNote(e.target.value)}
                            placeholder="Brief summary of activity..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[80px]"
                         />
                         <button
                            onClick={addActivity}
                            disabled={savingActivity || !activityNote.trim()}
                            className="absolute right-2 bottom-2 px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.1em] rounded shadow-md hover:bg-indigo-700"
                         >
                            SCHEDULE
                         </button>
                      </div>
                   </div>
                )}

                {showEmojiPicker && (
                    <div className="absolute bottom-[200px] right-8 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 grid grid-cols-4 gap-2 z-[60] animate-in zoom-in-95 duration-200">
                        {commonEmojis.map(emoji => (
                           <button key={emoji} onClick={() => addEmoji(emoji)} className="text-xl hover:scale-125 transition-transform p-1">{emoji}</button>
                        ))}
                    </div>
                )}
             </div>
          </div>
        </div>

        <LostModal
          isOpen={showLost}
          onClose={() => setShowLost(false)}
          onConfirm={markLost}
          loading={markingLost}
        />
      </div>
    </div>
  );
}

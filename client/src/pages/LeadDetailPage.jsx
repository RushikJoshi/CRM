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
import LostModal from "../components/LostModal";

const STAGE_LABELS = {
  new: "New",
  qualified: "Qualified",
  proposition: "Proposition",
  won: "Won",
};

const PIPELINE_STAGES = [
  { key: "new", label: "New" },
  { key: "qualified", label: "Qualified" },
  { key: "proposition", label: "Proposition" },
  { key: "won", label: "Won" },
];

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

function normalizeStageKey(stage) {
  const s = (stage || "new").toString();
  if (s === "new_lead") return "new";
  if (s === "proposal" || s === "prospect") return "proposition";
  if (s === "negotiation") return "proposition";
  if (s === "attempted_contact" || s === "contacted") return "new";
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
                className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
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
  const currentIndex = stages.findIndex(s => s.key === currentStage);
  
  return (
    <div className="flex items-center bg-gray-100/50 border border-gray-200 rounded-md overflow-hidden">
      {stages.map((s, idx) => {
        const isCurrent = s.key === currentStage;
        const isPast = currentIndex > idx;
        const isWon = s.key === 'won';
        
        return (
          <button
            key={s.key}
            onClick={() => !isWon && onUpdate(s.key)}
            disabled={updating || (isWon && !isCurrent)}
            className={`
              relative h-8 px-5 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center
              ${isCurrent ? 'bg-indigo-600 text-white z-10' : isPast ? 'bg-white text-gray-900 border-r border-gray-200' : 'bg-transparent text-gray-400'}
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
        <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-2xl font-black shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{lead.companyName || lead.name}</h3>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            {lead.companyName ? `${lead.companyName} specializes in providing industry-leading solutions in ${lead.industry || 'their sector'}.` : 'No additional company description available.'}
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
  const [activeTab, setActiveTab] = useState("notes");
  const [showLost, setShowLost] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);

  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [chatterTab, setChatterTab] = useState("log_note");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [noteMentionedUserId, setNoteMentionedUserId] = useState("");
  const [messageMentionedUserId, setMessageMentionedUserId] = useState("");
  const [activityMentionedUserId, setActivityMentionedUserId] = useState("");
  const [activityType, setActivityType] = useState("note");
  const [activityNote, setActivityNote] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [savingActivity, setSavingActivity] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savingMessage, setSavingMessage] = useState(false);
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const fileInputRef = React.useRef(null);
  const tagDropdownRef = React.useRef(null);

  useEffect(() => {
    const closeTag = (e) => {
      if (showTagDropdown && tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) setShowTagDropdown(false);
    };
    document.addEventListener("mousedown", closeTag);
    return () => document.removeEventListener("mousedown", closeTag);
  }, [showTagDropdown]);

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
      setLead(res.data?.data || res.data);
    } catch {
      setLead(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

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
  }, [fetchLead]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  useEffect(() => {
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
      <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
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

  const currentStageKey = normalizeStageKey(lead.stage || "new");
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
    <div className="h-[calc(100vh-56px)] bg-[#f3f4f6] overflow-auto">
      <div className="w-full bg-white min-h-full shadow-sm flex flex-col">
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
                className={`px-4 py-1.5 border text-[11px] font-bold uppercase rounded-md transition-all ${showEnrichment ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
               >
                 Enrich
               </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="max-w-[400px] overflow-x-auto no-scrollbar">
                <StageBreadcrumbs 
                  stages={PIPELINE_STAGES} 
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
                    <span className="flex-1 text-sm font-bold text-indigo-600 hover:underline cursor-pointer">{lead.name}</span>
                  </div>
                  <div className="flex items-center">
                    <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Email</label>
                    <span className="flex-1 text-sm text-indigo-600 hover:underline cursor-pointer">{lead.email || "—"}</span>
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
                  <label className="w-1/3 text-sm font-bold text-gray-900">Salesperson</label>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-200 text-[10px] flex items-center justify-center font-bold text-slate-600">D</div>
                    <span className="text-sm font-medium text-gray-700">{salesperson}</span>
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
                className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'notes' ? 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 Notes
               </button>
               <button 
                onClick={() => setActiveTab('extra')}
                className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'extra' ? 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
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
                  {noteText.trim() && (
                    <div className="mt-2 flex justify-end">
                       <button 
                        onClick={(e) => logNote(e)}
                        disabled={savingNote}
                        className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded shadow-sm hover:bg-indigo-700"
                       >
                         {savingNote ? 'Saving...' : 'Save Note'}
                       </button>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'extra' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* SECTION: COMPANY & MARKETING */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 border-b pb-1">Company Detail</h4>
                        <div className="space-y-4">
                           <div className="flex">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Company</label>
                             <span className="flex-1 text-sm text-gray-700">{lead.companyName || "—"}</span>
                           </div>
                           <div className="flex">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Website</label>
                             <span className="flex-1 text-sm text-indigo-600 hover:underline cursor-pointer">{lead.website || "—"}</span>
                           </div>
                           <div className="flex">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Industry</label>
                             <span className="flex-1 text-sm text-gray-700">{lead.industry || "—"}</span>
                           </div>
                           <div className="flex">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Size</label>
                             <span className="flex-1 text-sm text-gray-700">{lead.companySize || "—"}</span>
                           </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 border-b pb-1">Marketing</h4>
                        <div className="space-y-4">
                           <div className="flex">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Source</label>
                             <span className="flex-1 text-sm text-gray-700">{lead.source || "—"}</span>
                           </div>
                           <div className="flex">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Referred</label>
                             <span className="flex-1 text-sm text-gray-700">{lead.referredBy || "—"}</span>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION: CONTACT & POSITION */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 border-b pb-1">Job & Contact</h4>
                        <div className="space-y-4">
                           <div className="flex">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Job Title</label>
                             <span className="flex-1 text-sm text-gray-700">{lead.jobTitle || "—"}</span>
                           </div>
                           <div className="flex">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Alt Phone</label>
                             <span className="flex-1 text-sm text-gray-700">{lead.alternatePhone || "—"}</span>
                           </div>
                           <div className="flex">
                             <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Sec. Email</label>
                             <span className="flex-1 text-sm text-gray-700">{lead.secondaryEmail || "—"}</span>
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
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 border-b pb-1">Location Address</h4>
                      <div className="space-y-4">
                         <div className="flex">
                           <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Address</label>
                           <span className="flex-1 text-sm text-gray-700 whitespace-pre-wrap">{lead.address || "—"}</span>
                         </div>
                         <div className="flex">
                           <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">City</label>
                           <span className="flex-1 text-sm text-gray-700">{lead.location || lead.city || "—"}</span>
                         </div>
                         <div className="flex">
                           <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">State</label>
                           <span className="flex-1 text-sm text-gray-700">{lead.state || "—"}</span>
                         </div>
                         <div className="flex">
                           <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Country</label>
                           <span className="flex-1 text-sm text-gray-700">{lead.country || "—"}</span>
                         </div>
                         <div className="flex">
                           <label className="w-1/3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Zip Code</label>
                           <span className="flex-1 text-sm text-gray-700">{lead.zipCode || "—"}</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CHATTER SECTION (Right / Bottom) */}
          <div className="w-full xl:w-[500px] bg-slate-50/30 flex flex-col border-l border-gray-100 min-h-[600px]">
             {/* Chatter Controls */}
             <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-1">
                   <button 
                    onClick={() => setChatterTab('send_message')}
                    className={`px-4 py-2 text-xs font-bold rounded transition-colors ${chatterTab === 'send_message' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-700 hover:bg-gray-100'}`}
                   >
                     Send message
                   </button>
                   <button 
                    onClick={() => setChatterTab('log_note')}
                    className={`px-4 py-2 text-xs font-bold rounded transition-colors ${chatterTab === 'log_note' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-700 hover:bg-gray-100'}`}
                   >
                     Log note
                   </button>
                   <button 
                    onClick={() => setChatterTab('activity')}
                    className={`px-4 py-2 text-xs font-bold rounded transition-colors ${chatterTab === 'activity' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-700 hover:bg-gray-100'}`}
                   >
                     Activity
                   </button>
                </div>
                <div className="relative flex items-center gap-3 text-gray-400 border-l pl-4 border-gray-100" ref={tagDropdownRef}>
                   <button type="button" onClick={openFileInput} className="hover:text-gray-900 transition-colors" title="Attach document">
                      <FiPaperclip size={16} />
                   </button>
                   <button
                      type="button"
                      onClick={() => setShowTagDropdown((v) => !v)}
                      className="flex items-center gap-1 hover:text-gray-900 transition-colors cursor-pointer ml-1"
                      title="Tag person"
                   >
                      <FiUser size={16} />
                      <span className="text-xs font-bold">Tag</span>
                   </button>
                   {showTagDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-56 max-h-64 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                         <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">Tag person</p>
                         {users.length === 0 ? (
                            <p className="px-3 py-4 text-sm text-gray-400">No users loaded</p>
                         ) : (
                            users.map((u) => (
                               <button
                                  key={u._id}
                                  type="button"
                                  onClick={() => selectTaggedUser(u)}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-indigo-50 flex items-center gap-2"
                               >
                                  <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                                     {(u.name || "?").slice(0, 1).toUpperCase()}
                                  </span>
                                  {u.name}
                               </button>
                            ))
                         )}
                      </div>
                   )}
                </div>
             </div>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" aria-hidden="true" />

             {/* Chatter Form Area */}
             <div className="bg-white px-6 py-6 border-b border-gray-100">
                {chatterTab === 'send_message' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                     <textarea 
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Write a message..."
                        className="w-full min-h-[120px] text-sm text-gray-700 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                     />
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-gray-400">
                           <button type="button" className="p-1 hover:text-indigo-600"><FiSmile size={20} /></button>
                           <button 
                            type="button"
                            onClick={openFileInput}
                            className="p-1 hover:text-indigo-600 transition-colors"
                            title="Attach document"
                           >
                             <FiPaperclip size={20} />
                           </button>
                           <button 
                            type="button"
                            onClick={() => setShowTagDropdown(true)}
                            className="p-1 hover:text-indigo-600"
                            title="Tag person"
                           >
                             <FiAtSign size={20} />
                           </button>
                           <button type="button" className="p-1 hover:text-indigo-600"><FiLayers size={20} /></button>
                        </div>
                        <button 
                          onClick={sendMessage}
                          disabled={savingMessage || !messageText.trim() || uploadingFile}
                          className="px-6 py-2 bg-indigo-600 text-white text-xs font-black rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                        >
                          {savingMessage ? 'Sending...' : 'SEND'}
                        </button>
                     </div>

                     {/* ATTACHMENTS LIST */}
                     {attachments.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                           {attachments.map((file, i) => (
                             <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md text-[11px] font-bold text-gray-600 border border-gray-200">
                                <span className="truncate max-w-[150px]">{file.name}</span>
                                <button onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500"><FiX size={14} /></button>
                             </div>
                           ))}
                        </div>
                     )}
                     {uploadingFile && (
                        <div className="mt-2 text-[10px] text-indigo-500 font-bold animate-pulse">Uploading file...</div>
                     )}
                  </div>
                )}
                {chatterTab === 'log_note' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                     <textarea 
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Log an internal note..."
                        className="w-full min-h-[120px] text-sm text-gray-700 p-4 bg-amber-50/30 rounded-xl border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                     />
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-gray-400">
                           <button type="button" className="p-1 hover:text-amber-600"><FiSmile size={20} /></button>
                           <button 
                            type="button"
                            onClick={openFileInput}
                            className="p-1 hover:text-amber-600 transition-colors"
                            title="Attach document"
                           >
                             <FiPaperclip size={20} />
                           </button>
                           <button 
                            type="button"
                            onClick={() => setShowTagDropdown(true)}
                            className="p-1 hover:text-amber-600"
                            title="Tag person"
                           >
                             <FiAtSign size={20} />
                           </button>
                        </div>
                        <button 
                          onClick={logNote}
                          disabled={savingNote || !noteText.trim() || uploadingFile}
                          className="px-6 py-2 bg-gray-900 text-white text-xs font-black rounded-lg shadow-sm hover:bg-black disabled:opacity-50 transition-all active:scale-95"
                        >
                          {savingNote ? 'Logging...' : 'LOG NOTE'}
                        </button>
                     </div>

                     {/* ATTACHMENTS LIST */}
                     {attachments.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                           {attachments.map((file, i) => (
                             <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-amber-100/50 rounded-md text-[11px] font-bold text-amber-700 border border-amber-200">
                                <span className="truncate max-w-[150px]">{file.name}</span>
                                <button onClick={() => removeAttachment(i)} className="text-amber-400 hover:text-red-500"><FiX size={14} /></button>
                             </div>
                           ))}
                        </div>
                     )}
                     {uploadingFile && (
                        <div className="mt-2 text-[10px] text-amber-500 font-bold animate-pulse">Uploading file...</div>
                     )}
                  </div>
                )}
                {chatterTab === 'activity' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 transition-all">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase ml-1">Type</label>
                           <select 
                            value={activityType}
                            onChange={(e) => setActivityType(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                           >
                              {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase ml-1">Due Date</label>
                           <input 
                            type="date"
                            value={nextFollowUpDate}
                            onChange={(e) => setNextFollowUpDate(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                           />
                        </div>
                     </div>
                     <textarea 
                        value={activityNote}
                        onChange={(e) => setActivityNote(e.target.value)}
                        placeholder="Schedule an activity..."
                        className="w-full min-h-[100px] text-sm text-gray-700 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                     />
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={openFileInput}
                            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-2 text-xs font-bold"
                            title="Attach document"
                          >
                            <FiPaperclip size={18} />
                            {attachments.length > 0 ? `${attachments.length} file(s)` : 'Attach'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => setShowTagDropdown(true)}
                            className="p-1 text-gray-400 hover:text-indigo-600 flex items-center gap-1 text-xs font-bold"
                            title="Tag person"
                          >
                            <FiUser size={16} />
                            Tag
                          </button>
                        </div>
                        <button 
                          onClick={addActivity}
                          disabled={savingActivity || !activityNote.trim() || uploadingFile}
                          className="px-6 py-2 bg-indigo-600 text-white text-xs font-black rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                        >
                          {savingActivity ? 'Scheduling...' : 'SCHEDULE'}
                        </button>
                     </div>

                     {/* ATTACHMENTS LIST */}
                     {attachments.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                           {attachments.map((file, i) => (
                             <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md text-[11px] font-bold text-gray-600 border border-gray-200">
                                <span className="truncate max-w-[150px]">{file.name}</span>
                                <button onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500"><FiX size={14} /></button>
                             </div>
                           ))}
                        </div>
                     )}
                  </div>
                )}
             </div>

             {/* Activity Feed — Odoo-style vertical timeline */}
             <div className="flex-1 bg-white overflow-auto">
                <div className="relative min-h-[200px]">
                   {activityLoading ? (
                     <div className="flex justify-center py-12">
                       <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                     </div>
                   ) : activities.length === 0 ? (
                     <div className="py-20 text-center space-y-4">
                       <FiMessageSquare className="mx-auto text-gray-100" size={48} />
                       <p className="text-sm font-bold text-gray-300">No activity yet</p>
                     </div>
                   ) : (
                     <>
                       {/* Vertical connector line */}
                       <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" aria-hidden="true" />
                       <div className="relative pl-12 pr-4 py-4 space-y-1">
                         {groupActivitiesByDate(activities).map((group) => (
                           <div key={group.label} className="mb-6">
                             <div className="flex items-center gap-3 mb-4">
                               <div className="h-px flex-1 bg-gray-200" />
                               <span className="px-3 py-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-full border border-gray-100">
                                 {group.label}
                               </span>
                               <div className="h-px flex-1 bg-gray-200" />
                             </div>
                             <div className="space-y-0">
                               {group.items.map((item, idx) => (
                                 <ActivityItem
                                   key={item.id || item._id || idx}
                                   item={item}
                                   isLast={idx === group.items.length - 1}
                                 />
                               ))}
                             </div>
                           </div>
                         ))}
                       </div>
                     </>
                   )}
                </div>
             </div>

             {/* COMPANY ENRICHMENT SECTION */}
             {showEnrichment && (
               <div className="px-6 pb-12 bg-white border-t border-gray-100">
                  <EnrichmentCard lead={lead} />
               </div>
             )}
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

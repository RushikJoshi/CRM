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
  FiCheckSquare,
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
  FiInbox,
  FiPlus,
} from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
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
  follow_up: "Follow-up",
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
   
   // Clean up message
   const displayMessage = item.note ?? item.title ?? "";
   const { message, followUpDate } = parseNoteAndFollowUp(displayMessage);

   // Type-specific config
   const typeColors = {
      email: { icon: <FiMail />, bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", accent: "bg-indigo-600" },
      call: { icon: <FiPhone />, bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100", accent: "bg-teal-600" },
      meeting: { icon: <FiCalendar />, bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-100", accent: "bg-cyan-600" },
      note: { icon: <FiFileText />, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", accent: "bg-amber-600" },
      lead_stage_changed: { icon: <FiLayers />, bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", accent: "bg-violet-600" },
      lead_assigned: { icon: <FiUser />, bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-100", accent: "bg-gray-600" },
      lead_lost: { icon: <FiX />, bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", accent: "bg-rose-600" },
      system: { icon: <FiInfo />, bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-100", accent: "bg-slate-600" },
      follow_up: { icon: <FiClock />, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", accent: "bg-emerald-600" },
      whatsapp: { icon: <FiMessageSquare />, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", accent: "bg-emerald-600" },
   };

   const config = typeColors[item.type] || typeColors.system;

   const userName = typeof item.user?.name === 'string' ? item.user.name : (item.user || "System").toString();
   const userInitials = typeof userName === 'string' ? userName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?" : "?";

   return (
      <div className="relative group">
         {/* Vertical Connector Line */}
         {!isLast && (
           <div className="absolute left-[31px] top-[48px] bottom-[-24px] w-px bg-gradient-to-b from-gray-100 via-gray-100 to-transparent z-0 group-last:hidden" />
         )}

         <div className="flex gap-8 relative z-10">
            {/* Left Rail: Icon & Avatar */}
             <div className="flex flex-col items-center shrink-0">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl ${config.bg} ${config.border} border flex items-center justify-center text-lg md:text-xl ${config.text} shadow-xl shadow-gray-100 group-hover:scale-110 transition-transform duration-300`}>
                   {config.icon}
                </div>
             </div>

            {/* Right Side: Content Card */}
            <div className="flex-1 pb-16">
               <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col">
                     <div className="flex items-center gap-3 mb-1">
                        <span className="text-[12px] font-black text-gray-900 tracking-tight">{userName}</span>
                        <span className={`px-2 py-0.5 rounded-full ${config.bg} ${config.text} text-[8px] font-black uppercase tracking-widest`}>
                           {label}
                        </span>
                     </div>
                     <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{timeStr}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-300">
                     {userInitials}
                  </div>
               </div>

               <div className="bg-white/50 hover:bg-white border border-gray-50 hover:border-gray-100 rounded-[32px] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-200/50">
                  <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{message || "No additional notes provided."}</p>
                  
                  {followUpDate && (
                    <div className={`mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-2xl ${getFollowUpBadgeClass(followUpDate)} text-[10px] font-black uppercase tracking-widest`}>
                       <FiClock size={14} />
                       Follow-up scheduled: {formatDate(followUpDate)}
                    </div>
                  )}

                  {item.attachments && item.attachments.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {item.attachments.map((file, idx) => (
                          <a
                             key={idx}
                             href={file.url}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 rounded-2xl transition-all group/file"
                          >
                             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-400 group-hover/file:text-indigo-600 shadow-sm transition-colors">
                                <FiFileText size={20} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-gray-900 uppercase truncate mb-0.5">{file.name}</p>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Download Attachment</p>
                             </div>
                             <FiDownload size={14} className="text-gray-300 group-hover/file:text-indigo-600 transition-colors" />
                          </a>
                       ))}
                    </div>
                  )}
               </div>
            </div>
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
            onClick={() => onUpdate(s.key)}
            disabled={updating || (isWon && isCurrent)}
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

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const socket = useSocket();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatterTab, setChatterTab] = useState("all");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailFrom, setEmailFrom] = useState("Gitakshmi Group <support@gitakshmigroup.com>");
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
  const [activeTab, setActiveTab] = useState("notes");
  const [showLost, setShowLost] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [editingSection, setEditingSection] = useState(null);
  const [editedLead, setEditedLead] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpType, setFollowUpType] = useState("call");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("10:00");
  const [followUpNote, setFollowUpNote] = useState("");
  const [activeQuickAction, setActiveQuickAction] = useState(null); 
  const [proctoring, setProctoring] = useState(null);
  const [proctoringLoading, setProctoringLoading] = useState(false);

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await API.get("/pipeline");
      const data = res.data?.data || null;
      setPipeline(data);
    } catch (err) {
      console.error("PIPELINE FETCH ERROR:", err);
    }
  }, []);
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
   const [showTagDropdown, setShowTagDropdown] = useState(false);
   const [mentionSearch, setMentionSearch] = useState("");
   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
   const fileInputRef = React.useRef(null);
   const tagDropdownRef = React.useRef(null);
   const emojiPickerRef = React.useRef(null);
   const mentionDropdownRef = React.useRef(null);

  useEffect(() => {
    const closeOverlay = (e) => {
      if (showTagDropdown && tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) setShowTagDropdown(false);
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", closeOverlay);
    return () => document.removeEventListener("mousedown", closeOverlay);
  }, [showTagDropdown, showEmojiPicker]);

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
      const newFile = { name: res.data.data.name, url: res.data.data.url, size: (file.size / 1024 / 1024).toFixed(2) + " MB" };
      setAttachments(prev => [...prev, newFile]);
      
      // Save it as an activity so it persists
      await API.post("/activities", {
        leadId: id,
        type: "note",
        note: `Document Uploaded: ${newFile.name}`,
        attachments: [newFile]
      });

      toast.success("File uploaded.");
      fetchTimeline();
      setActiveTab('docs');
      setActiveQuickAction(null);
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
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
      
      // Clean up payload — never send system fields or IDs back in a patch
      const { _id, companyId, branchId, createdBy, createdAt, updatedAt, __v, customId, ...payload } = editedLead;
      
      const res = await API.patch(`/leads/${id}`, payload);
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
    if (!socket || !id) return;
    const handleUpdate = (data) => {
      if (data.leadId === id) {
        fetchLead();
        fetchTimeline();
      }
    };
    socket.on("lead_updated", handleUpdate);
    return () => socket.off("lead_updated", handleUpdate);
  }, [socket, id, fetchLead, fetchTimeline]);

  const fetchFollowUps = useCallback(async () => {
    if (!id) return;
    setFollowUpLoading(true);
    try {
      const res = await API.get(`/follow-ups/lead/${id}/follow-ups`);
      setFollowUps(res.data?.data || []);
    } catch {
      setFollowUps([]);
    } finally {
      setFollowUpLoading(false);
    }
  }, [id]);

  const fetchProctoring = useCallback(async (token) => {
    if (!token) return;
    setProctoringLoading(true);
    try {
      const res = await API.get(`/test/management/proctoring/${token}`);
      setProctoring(res.data?.data || null);
    } catch (err) {
      console.error("Failed to load proctoring log", err);
    } finally {
      setProctoringLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
    fetchFollowUps();
  }, [fetchTimeline, fetchFollowUps]);

  useEffect(() => {
    if (lead?.testToken) {
        fetchProctoring(lead.testToken);
    }
  }, [lead?.testToken, fetchProctoring]);

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

  const onSendEmail = async (e) => {
    if (e) e.preventDefault();
    if (!emailBody.trim() || !id) return;
    setSendingEmail(true);
    try {
      await API.post("/email/send", {
        to: emailTo,
        from: emailFrom,
        leadId: id,
        templateId: selectedTemplate || undefined,
        subject: emailSubject,
        body: emailBody,
      });
      toast.success("Email sent!");
      setEmailSubject("");
      setEmailBody("");
      setSelectedTemplate("");
      setActiveQuickAction(null);
      fetchTimeline();
      fetchLead();
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
    if (e) e.preventDefault();
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
      setActiveQuickAction(null);
      toast.success("Note saved.");
      fetchTimeline();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save note.");
    } finally {
      setSavingNote(false);
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
  const salesperson = lead?.assignedTo?.name || "Unassigned";
  const expectedClosing = lead?.wonAt || lead?.updatedAt || null;
  const leadTags = [lead?.source, lead?.course].filter(Boolean);

  return (
    <div className="bg-white min-h-screen overflow-x-hidden font-inter">
      <div className="w-full bg-white shadow-sm flex flex-col">
        {/* Status Header */}
        <div className="px-4 md:px-6 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between bg-white relative gap-4">
           {/* Breadcrumbs Section */}
           <div className="flex items-center gap-3 w-full lg:w-auto">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200 shrink-0">
                <FiArrowLeft size={18} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                 <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded border shrink-0 ${isWon ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isLost ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                   {statusNorm.toUpperCase()}
                 </span>
                 <div className="flex items-center text-xs font-bold text-gray-400 min-w-0 flex-1">
                   <span className="hidden xs:inline">{pipeline?.name || "Pipeline"}</span>
                   <FiChevronRight size={14} className="hidden xs:inline text-gray-200" />
                   <span className="text-gray-900 truncate max-w-[150px]">{lead.customId || lead.name || "Opportunity"}</span>
                   <div className="hidden sm:flex items-center ml-4 gap-2 border-l pl-4 border-gray-100">
                      <span className="text-indigo-600 font-black uppercase tracking-widest text-[9px] truncate">Agent: {salesperson.split(' ')[0]}</span>
                   </div>
                 </div>
              </div>
           </div>

           {/* Actions Section */}
           <div className="flex flex-1 flex-row items-center justify-between lg:justify-end gap-3 w-full lg:w-auto overflow-hidden">
              <div className="flex items-center gap-2 shrink-0">
                 {!isWon && !isLost && (
                   <>
                     <button 
                      onClick={() => markWon()}
                      disabled={updatingStage}
                      className="px-3 md:px-4 py-1.5 bg-emerald-600 text-white text-[10px] md:text-[11px] font-bold uppercase rounded-md shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                     >
                       Won
                     </button>
                     <button 
                      onClick={() => setShowLost(true)}
                      className="px-3 md:px-4 py-1.5 bg-white border border-gray-200 text-gray-700 text-[10px] md:text-[11px] font-bold uppercase rounded-md hover:bg-gray-50"
                     >
                       Lost
                     </button>
                   </>
                 )}
                 <button 
                   onClick={() => setShowEnrichment(!showEnrichment)}
                   className={`px-3 md:px-4 py-1.5 border text-[10px] md:text-[11px] font-bold uppercase rounded-md transition-all ${showEnrichment ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                 >
                   Enrich
                 </button>
              </div>

              <div className="flex-1 min-w-0 max-w-[200px] sm:max-w-md overflow-x-auto no-scrollbar py-1">
                 <StageBreadcrumbs stages={navStages} currentStage={currentStageKey} onUpdate={updateStage} updating={updatingStage} />
              </div>

              <div className="hidden lg:flex items-center gap-1 text-gray-400 text-sm border-l pl-4 border-gray-100 shrink-0">
                 <button className="p-1 hover:text-gray-900" onClick={() => navigate(-1)} title="Back"><FiChevronLeft size={20} /></button>
                 <button className="p-1 hover:text-gray-900" title="Next"><FiChevronRight size={20} /></button>
              </div>
           </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-6 py-6 font-inter">
        <div className="w-full">
          <div className="p-0">
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight break-words">{lead.name || "Opportunity"}{"'s opportunity"}</h1>
                
                <div className="inline-flex items-center gap-0.5 px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      className={`text-lg transition-all duration-500 ${star <= (lead.rating || 1) ? 'text-amber-400 drop-shadow-sm scale-110' : 'text-gray-200'}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Engagement</span>
                </div>

                {lead.inquiryId && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">
                    <FiInbox size={12} /> Converted from Inquiry
                  </div>
                )}
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-12">
               <div className="space-y-4">
                <div className="flex items-start group">
                  <label className="w-32 shrink-0 text-sm font-bold text-gray-900 pt-0.5">Expected Revenue</label>
                  <div className="flex-1 flex items-center gap-3">
                    {editingSection === 'revenue' ? (
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-gray-400">₹</span>
                         <input 
                           type="number"
                           value={editedLead.expectedRevenue || 0}
                           onChange={(e) => handleEditChange('expectedRevenue', e.target.value)}
                           className="w-32 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-indigo-100"
                         />
                         <button onClick={() => saveDetails('revenue')} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Apply</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">₹ {Number(lead.expectedRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        <button onClick={() => setEditingSection('revenue')} className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Edit</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center group">
                  <label className="w-32 shrink-0 text-sm font-bold text-gray-900">Probability</label>
                  <div className="flex-1 flex items-center gap-3">
                    {editingSection === 'probability' ? (
                       <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            max="100"
                            value={editedLead.probability || 0}
                            onChange={(e) => handleEditChange('probability', e.target.value)}
                            className="w-20 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-indigo-100"
                          />
                          <span className="text-xs font-bold text-gray-400">%</span>
                          <button onClick={() => saveDetails('probability')} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Apply</button>
                       </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-gray-900">{probability.toFixed(2)} %</span>
                        <button onClick={() => setEditingSection('probability')} className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Edit</button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-6 space-y-4 border-t border-gray-50">
                  <div className="flex items-center">
                    <label className="w-32 shrink-0 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Contact</label>
                    <span className="flex-1 text-sm font-bold text-teal-600 hover:underline cursor-pointer truncate">{lead.name}</span>
                  </div>
                  <div className="flex items-center">
                    <label className="w-32 shrink-0 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Email</label>
                    <span className="flex-1 text-sm text-teal-600 hover:underline cursor-pointer truncate">{lead.email || "—"}</span>
                  </div>
                  <div className="flex items-center">
                    <label className="w-32 shrink-0 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Phone</label>
                    <span className="flex-1 text-sm text-gray-700">{lead.phone || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-l pl-8 border-gray-100">
                <div className="flex items-center">
                  <label className="w-32 shrink-0 text-sm font-bold text-gray-900">Assigned To</label>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 shrink-0 rounded bg-indigo-50 text-[10px] flex items-center justify-center font-black text-indigo-600 border border-indigo-100">{salesperson.charAt(0)}</div>
                    <span className="text-sm font-bold text-gray-800 uppercase tracking-tight truncate">{salesperson}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <label className="w-32 shrink-0 text-sm font-bold text-gray-900">Expected Closing</label>
                  <span className="flex-1 text-sm text-gray-400 font-medium italic">{formatDate(expectedClosing) === "—" ? "No closing estimate" : formatDate(expectedClosing)}</span>
                </div>
                <div className="flex items-center">
                  <label className="w-32 shrink-0 text-sm font-bold text-gray-900">Tags</label>
                  <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
                    {leadTags.length > 0 ? leadTags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded border border-slate-100">{t}</span>
                    )) : <span className="text-gray-400 text-xs italic">No tags</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK ACTION BAR */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-50/50 rounded-2xl border border-gray-100/50 my-12 shadow-sm overflow-x-auto no-scrollbar">
               {[
                  { id: 'task', label: 'New Task', icon: FiCheckSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { id: 'meeting', label: 'Meeting', icon: FiCalendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { id: 'note', label: 'Add Note', icon: FiFileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { id: 'email', label: 'Send Email', icon: FiMail, color: 'text-violet-600', bg: 'bg-violet-50' },
                  { id: 'doc', label: 'Attach Doc', icon: FiPaperclip, color: 'text-blue-600', bg: 'bg-blue-50' },
               ].map((act) => (
                  <button
                    key={act.id}
                    onClick={() => setActiveQuickAction(activeQuickAction === act.id ? null : act.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all group min-w-fit ${activeQuickAction === act.id ? 'bg-white shadow-xl ring-1 ring-gray-100 scale-105' : 'hover:bg-white hover:shadow-md'}`}
                  >
                    <div className={`p-2 rounded-lg ${act.bg} ${act.color} group-hover:rotate-12 transition-transform`}>
                       <act.icon size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-900">{act.label}</span>
                  </button>
               ))}
            </div>

            {/* DYNAMIC QUICK ACTION INPUT AREA */}
            {activeQuickAction && (
               <div className="mb-12 p-8 bg-white border border-indigo-100 shadow-2xl shadow-indigo-600/5 rounded-3xl animate-in slide-in-from-top-4 duration-500 relative z-50">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                     <h3 className="text-[11px] font-black uppercase tracking-[3px] text-gray-400">
                        {activeQuickAction === 'task' ? 'Schedule Task' : activeQuickAction === 'meeting' ? 'Schedule Meeting' : activeQuickAction === 'note' ? 'Log Internal Note' : activeQuickAction === 'email' ? 'Compose Email' : 'Upload Documents'}
                     </h3>
                     <button onClick={() => setActiveQuickAction(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><FiX size={18} /></button>
                  </div>

                  {activeQuickAction === 'task' && (
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="flex gap-2">
                              <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold" />
                              <input type="time" value={followUpTime} onChange={(e) => setFollowUpTime(e.target.value)} className="w-32 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold" />
                           </div>
                           <select value={followUpType} onChange={(e) => setFollowUpType(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold">
                              <option value="call">📞 Phone Call</option>
                              <option value="whatsapp">💬 WhatsApp</option>
                              <option value="email">📧 Send Email</option>
                           </select>
                        </div>
                        <textarea value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} placeholder="Action details and context..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 text-sm min-h-[120px] focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
                        <div className="flex justify-end"><button onClick={() => toast.info("Task scheduling logic... ")} className="px-12 py-4 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all">Commit Task</button></div>
                     </div>
                  )}

                  {activeQuickAction === 'note' && (
                     <div className="space-y-6 relative">
                        <div className="relative">
                          <textarea 
                            value={noteText} 
                            onChange={(e) => {
                               const val = e.target.value;
                               setNoteText(val);
                               const lastChar = val[val.length - 1];
                               if (lastChar === '@') {
                                  setShowTagDropdown(true);
                                  setMentionSearch("");
                               } else if (showTagDropdown) {
                                  const parts = val.split('@');
                                  setMentionSearch(parts[parts.length - 1] || "");
                               }
                            }} 
                            placeholder="Enter internal collaboration notes... Type @ to tag a team member" 
                            className="w-full bg-amber-50/10 border border-amber-200/40 rounded-2xl p-6 text-sm min-h-[150px] focus:ring-2 focus:ring-amber-100 outline-none transition-all" 
                          />
                          
                          {showTagDropdown && (
                             <div ref={mentionDropdownRef} className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-300 z-[100]">
                                <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mention Team Member</span>
                                </div>
                                <div className="max-h-48 overflow-y-auto no-scrollbar">
                                   {users.filter(u => u.name?.toLowerCase().includes(mentionSearch.toLowerCase())).length > 0 ? (
                                      users.filter(u => u.name?.toLowerCase().includes(mentionSearch.toLowerCase())).map(u => (
                                         <button 
                                           key={u._id}
                                           onClick={() => {
                                              setNoteMentionedUserId(u._id);
                                              const parts = noteText.split('@');
                                              parts[parts.length - 1] = u.name + " ";
                                              setNoteText(parts.join('@'));
                                              setShowTagDropdown(false);
                                              toast.success(`Tagged ${u.name}`);
                                           }}
                                           className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-left group"
                                         >
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black border border-indigo-100 group-hover:bg-white transition-colors">{u.name?.charAt(0)}</div>
                                            <div className="flex-1 min-w-0">
                                               <p className="text-xs font-bold text-gray-900 truncate">{u.name}</p>
                                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{u.role || 'Member'}</p>
                                            </div>
                                         </button>
                                      ))
                                   ) : (
                                      <div className="p-4 text-center text-gray-400 text-xs italic">No team members found</div>
                                   )}
                                </div>
                             </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              {noteMentionedUserId && (
                                 <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full animate-in zoom-in-50 duration-300">
                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Mentioned: {users.find(u => u._id === noteMentionedUserId)?.name}</span>
                                    <button onClick={() => setNoteMentionedUserId("")} className="text-amber-300 hover:text-amber-600"><FiX size={10} /></button>
                                 </div>
                              )}
                           </div>
                           <button onClick={logNote} className="px-12 py-4 bg-amber-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all">Post Note</button>
                        </div>
                     </div>
                  )}

                  {activeQuickAction === 'email' && (
                     <div className="space-y-4 font-inter">
                        <div className="grid grid-cols-1 gap-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                           <div className="flex items-center gap-4">
                              <span className="w-16 text-[10px] font-black uppercase tracking-widest text-gray-400">From</span>
                              <input 
                                 placeholder="Sender email name <email@example.com>..." 
                                 value={emailFrom} 
                                 onChange={e => setEmailFrom(e.target.value)} 
                                 className="flex-1 bg-white border border-gray-100 rounded-lg px-3 py-1 text-sm font-bold text-gray-700 placeholder-gray-300 focus:ring-2 focus:ring-indigo-50 focus:border-indigo-200 transition-all font-inter" 
                              />
                           </div>
                           <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
                              <span className="w-16 text-[10px] font-black uppercase tracking-widest text-gray-400">To</span>
                              <input 
                                 placeholder="Recipient email address..." 
                                 value={emailTo} 
                                 onChange={e => setEmailTo(e.target.value)} 
                                 className="flex-1 bg-white border border-gray-100 rounded-lg px-3 py-1 text-sm font-bold text-teal-600 placeholder-gray-300 focus:ring-2 focus:ring-teal-50 focus:border-teal-200 transition-all font-inter" 
                              />
                           </div>
                           <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
                              <span className="w-16 text-[10px] font-black uppercase tracking-widest text-gray-400">Subject</span>
                              <input 
                                 placeholder="Enter message subject..." 
                                 value={emailSubject} 
                                 onChange={e => setEmailSubject(e.target.value)} 
                                 className="flex-1 bg-white border border-gray-100 rounded-lg px-3 py-1 text-sm font-bold text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 transition-all" 
                              />
                           </div>
                        </div>
                        <div className="relative group">
                           <textarea 
                              value={emailBody} 
                              onChange={(e) => setEmailBody(e.target.value)} 
                              placeholder="Write your email here..." 
                              className="w-full bg-white border border-gray-200 rounded-2xl p-6 text-sm min-h-[250px] shadow-inner focus:ring-4 focus:ring-indigo-50 outline-none transition-all leading-relaxed" 
                           />
                           <div className="absolute bottom-4 right-4 flex items-center gap-3">
                              <button onClick={() => setEmailBody('')} className="p-2 text-gray-300 hover:text-rose-500 transition-colors"><FiX size={16} /></button>
                           </div>
                        </div>
                        <div className="flex justify-end pt-2">
                           <button 
                              onClick={() => {
                                 if (!emailTo.trim()) {
                                    toast.error("Please enter a recipient email.");
                                    return;
                                 }
                                 if (!emailBody.trim()) {
                                    toast.error("Please enter an email body.");
                                    return;
                                 }
                                 onSendEmail();
                              }} 
                              className={`px-12 py-4 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:translate-y-[-2px] active:translate-y-[0px] transition-all flex items-center gap-2 ${sendingEmail ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                           >
                              <FiSend size={14} />
                              {sendingEmail ? 'Sending...' : 'Send Message'}
                           </button>
                        </div>
                     </div>
                  )}

                  {activeQuickAction === 'doc' && (
                     <div className="border-4 border-dashed border-gray-50 rounded-[40px] p-20 text-center hover:bg-indigo-50/5 hover:border-indigo-100 transition-all cursor-pointer group" onClick={openFileInput}>
                        <div className="p-6 bg-indigo-50 text-indigo-600 rounded-3xl w-fit mx-auto mb-6 scale-125 group-hover:rotate-12 transition-transform"><FiPaperclip size={32} /></div>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Select documents to upload</p>
                        <p className="text-xs text-gray-400 mt-3 font-medium">PDF, DOCX, JPG supported (Max 10MB)</p>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                     </div>
                  )}
               </div>
            )}

            {/* Content Tabs */}
            <div className="border-b border-gray-100 flex items-center gap-12">
               {['notes', 'extra', 'docs', (lead?.testToken ? 'proctoring' : null)].filter(Boolean).map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-[11px] font-black uppercase tracking-[2px] transition-all relative ${activeTab === tab ? 'text-teal-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-teal-600 after:rounded-t-full' : 'text-gray-400 hover:text-gray-900'}`}
                  >
                    {tab === 'notes' ? 'Description' : tab === 'extra' ? 'Extra Info' : tab === 'docs' ? 'Attachments' : 'AI Proctoring'}
                  </button>
               ))}
            </div>

            <div className="py-8">
              {activeTab === 'notes' && (
                <div className="flex flex-col gap-4 animate-in slide-in-from-top-4 duration-500">
                  <div className="group bg-slate-50/30 p-8 rounded-3xl border border-dashed border-gray-100 min-h-[300px] relative">
                     <textarea 
                       value={editedLead.notes || ""}
                       onChange={(e) => handleEditChange('notes', e.target.value)}
                       placeholder="Enter internal lead description, situational context, or important context here..."
                       className="w-full h-full text-sm text-gray-700 placeholder-gray-300 bg-transparent border-none focus:ring-0 resize-none leading-relaxed"
                     />
                     <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Auto-saved to lead file</span>
                     </div>
                  </div>
                  <div className="flex justify-end">
                     <button 
                       onClick={() => saveDetails('notes')}
                       className="px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all"
                     >
                        Update Description
                     </button>
                  </div>
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
                   {activities.filter(a => a.attachments && a.attachments.length > 0).flatMap(a => a.attachments).map((doc, idx) => (
                      <div key={idx} className="p-6 bg-white border border-gray-100 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-indigo-600/5 transition-all group relative overflow-hidden">
                         <div className="aspect-square bg-indigo-50/30 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-3 group-hover:scale-95">
                            <FiFileText size={40} className="text-gray-300 group-hover:text-indigo-600 transition-colors" strokeWidth={1.5} />
                         </div>
                         <h5 className="text-[11px] font-black uppercase tracking-tight text-gray-900 truncate mb-1">{doc.name || 'document.pdf'}</h5>
                         <div className="flex items-center justify-between mt-2">
                           <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{doc.size || '1.2 MB'}</p>
                           <button className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><FiDownload size={14} /></button>
                         </div>
                      </div>
                   ))}
                   <div 
                      onClick={() => setActiveQuickAction('doc')}
                      className="p-6 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/10 hover:border-indigo-200 transition-all text-gray-300 min-h-[200px] group"
                   >
                      <div className="p-4 bg-gray-50 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors mb-4">
                         <FiPlus size={24} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-[2px]">Upload</span>
                   </div>
                </div>
              )}

              {activeTab === 'extra' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
                    {/* Section: Company */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Company</h4>
                        <button onClick={() => setEditingSection(editingSection === 'company' ? null : 'company')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">{editingSection === 'company' ? 'SAVE' : 'EDIT'}</button>
                      </div>
                      
                      {editingSection === 'company' ? (
                        <div className="space-y-4">
                          {[
                            { label: 'Name', key: 'companyName' },
                            { label: 'Website', key: 'website' },
                            { label: 'Industry', key: 'industry' },
                            { label: 'Size', key: 'companySize' },
                          ].map(f => (
                            <div key={f.key}>
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{f.label}</label>
                              <input 
                                value={editedLead[f.key] || ""} 
                                onChange={e => handleEditChange(f.key, e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-100 transition-all"
                              />
                            </div>
                          ))}
                          <button onClick={() => saveDetails('company')} className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-600/20 mt-2">Update Company</button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {[
                            { label: 'Name', val: lead.companyName },
                            { label: 'Website', val: lead.website },
                            { label: 'Industry', val: lead.industry },
                            { label: 'Size', val: lead.companySize },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between group/row">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</span>
                              <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">{row.val || '—'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section: Marketing */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Marketing</h4>
                        <button onClick={() => setEditingSection(editingSection === 'marketing' ? null : 'marketing')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">{editingSection === 'marketing' ? 'SAVE' : 'EDIT'}</button>
                      </div>
                      
                      {editingSection === 'marketing' ? (
                        <div className="space-y-4">
                          {[
                            { label: 'Source', key: 'source' },
                            { label: 'Campaign', key: 'campaign' },
                            { label: 'Medium', key: 'medium' },
                          ].map(f => (
                            <div key={f.key}>
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{f.label}</label>
                              <input 
                                value={editedLead[f.key] || ""} 
                                onChange={e => handleEditChange(f.key, e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-100 transition-all"
                              />
                            </div>
                          ))}
                          <button onClick={() => saveDetails('marketing')} className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-600/20 mt-2">Update Marketing</button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {[
                            { label: 'Source', val: lead.source },
                            { label: 'Campaign', val: lead.campaign },
                            { label: 'Medium', val: lead.medium },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between group/row">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</span>
                              <span className="text-sm font-medium text-gray-700 truncate max-w-[150px] font-bold text-teal-600">{row.val || '—'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section: Location */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Location</h4>
                        <button onClick={() => setEditingSection(editingSection === 'location' ? null : 'location')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">{editingSection === 'location' ? 'SAVE' : 'EDIT'}</button>
                      </div>
                      
                      {editingSection === 'location' ? (
                        <div className="space-y-4">
                          {[
                            { label: 'City', key: 'city' },
                            { label: 'Address', key: 'address' },
                            { label: 'Location', key: 'location' },
                          ].map(f => (
                            <div key={f.key}>
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{f.label}</label>
                              <input 
                                value={editedLead[f.key] || ""} 
                                onChange={e => handleEditChange(f.key, e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-100 transition-all"
                              />
                            </div>
                          ))}
                          <button onClick={() => saveDetails('location')} className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-600/20 mt-2">Update Location</button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {[
                            { label: 'City', val: lead.city },
                            { label: 'Address', val: lead.address },
                            { label: 'Location', val: lead.location },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between group/row">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</span>
                              <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">{row.val || '—'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section: Academic */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Academic</h4>
                        <button onClick={() => setEditingSection(editingSection === 'academic' ? null : 'academic')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">{editingSection === 'academic' ? 'SAVE' : 'EDIT'}</button>
                      </div>
                      
                      {editingSection === 'academic' ? (
                        <div className="space-y-4">
                          {[
                            { label: 'Course', key: 'course' },
                            { label: 'Degree', key: 'courseSelected' },
                            { label: 'Score', key: 'testScore', type: 'number' },
                          ].map(f => (
                            <div key={f.key}>
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{f.label}</label>
                              <input 
                                type={f.type || 'text'}
                                value={editedLead[f.key] || ""} 
                                onChange={e => handleEditChange(f.key, e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-indigo-100 transition-all"
                              />
                            </div>
                          ))}
                          <button onClick={() => saveDetails('academic')} className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-600/20 mt-2">Update Academic</button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {[
                            { label: 'Course', val: lead.course },
                            { label: 'Degree', val: lead.courseSelected },
                            { label: 'Score', val: lead.testScore },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between group/row">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</span>
                              <span className="text-sm font-black text-indigo-600 truncate max-w-[150px]">{row.val || '—'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'proctoring' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {proctoringLoading ? (
                        <div className="flex flex-col items-center py-20">
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Hydrating Proctoring Report...</p>
                        </div>
                    ) : proctoring ? (
                        <div className="space-y-12">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-white border border-gray-100 rounded-[32px] p-8 flex flex-col items-center justify-center shadow-sm relative overflow-hidden group">
                                   <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
                                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Integrity Score</span>
                                   <div className="flex items-baseline gap-2">
                                      <span className={`text-7xl font-black ${proctoring.score > 80 ? 'text-emerald-500' : 'text-rose-500'}`}>{proctoring.score}</span>
                                      <span className="text-xl font-bold text-slate-300">/ 100</span>
                                   </div>
                                </div>
                                <div className={`rounded-[32px] p-8 flex flex-col items-center justify-center border shadow-sm relative overflow-hidden group ${proctoring.score > 80 ? 'bg-emerald-50/30 border-emerald-100 text-emerald-700' : 'bg-rose-50/30 border-rose-100 text-rose-700'}`}>
                                   <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-bl-full -mr-12 -mt-12"></div>
                                   <span className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-4">Security Level</span>
                                   <span className="text-3xl font-black uppercase tracking-tight">{proctoring.score > 80 ? 'Low' : proctoring.score >= 50 ? 'Medium' : 'High'} Risk</span>
                                   <div className="mt-4 px-3 py-1 bg-white/50 rounded-full text-[9px] font-black uppercase tracking-widest">
                                       Status: {lead.proctoringStatus || 'unknown'}
                                   </div>
                                </div>
                                <div className="bg-indigo-600 rounded-[32px] p-8 text-white flex flex-col items-center justify-center shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                                   <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
                                   <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Assessment Verfied</span>
                                   <FiCheckCircle size={40} className="mb-2" />
                                   <span className="text-[9px] font-bold opacity-70">AI MONITORING ACTIVE</span>
                                </div>
                            </div>

                            {/* Violation Details */}
                            <div className="bg-white border border-gray-100 rounded-[40px] overflow-hidden shadow-sm">
                                <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
                                    <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                                        Telemetry Violations
                                    </h4>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Real-time Forensics</span>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <tr>
                                                <th className="px-10 py-6">Incident Category</th>
                                                <th className="px-10 py-6">Hits Recorded</th>
                                                <th className="px-10 py-6 text-right">Integrity Impact</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {[
                                                { label: 'Face Detection Failure', key: 'noFace', weight: 10 },
                                                { label: 'Multiple Entities Present', key: 'multipleFaces', weight: 30 },
                                                { label: 'Browser Context Switch', key: 'tabSwitch', weight: 20 },
                                                { label: 'Acoustic Interference', key: 'noise', weight: 10 },
                                                { label: 'Security Modality Violation', key: 'fullscreenExit', weight: 15 }
                                            ].map((v) => (
                                                <tr key={v.key} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-10 py-8">
                                                        <div className="flex flex-col">
                                                            <span className="text-[15px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{v.label}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium mt-1">Weight: {v.weight}% per event</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${(proctoring.violations?.[v.key] || 0) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            {proctoring.violations?.[v.key] || 0}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className={`text-[13px] font-black ${(proctoring.violations?.[v.key] || 0) > 0 ? 'text-rose-600' : 'text-emerald-500'}`}>
                                                                {(proctoring.violations?.[v.key] || 0) > 0 ? `-${(proctoring.violations?.[v.key] || 0) * v.weight}%` : 'NO IMPACT'}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter mt-1">Forensic Analysis</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-40 text-center bg-gray-50/50 rounded-[40px] border border-dashed border-gray-100">
                            <FiAlertTriangle className="mx-auto text-gray-200 mb-6" size={64} />
                            <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">No proctoring record found</h3>
                            <p className="text-[11px] text-gray-300 mt-2 font-bold uppercase tracking-[0.2em]">The candidate may not have used the secure browser mode.</p>
                        </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* UNIFIED ACTIVITY TIMELINE */}
        <div className="mt-16 w-full space-y-12 mb-32 border-t border-gray-100 pt-16 px-6">
          <div className="px-4 text-center mb-16">
            <div className="w-px h-16 bg-gradient-to-b from-transparent to-indigo-200 mx-auto mb-8" />
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="group inline-flex items-center gap-4 px-10 py-4 bg-white border border-gray-100 rounded-full shadow-2xl shadow-indigo-600/5 hover:shadow-indigo-600/10 hover:border-indigo-100 transition-all duration-500"
            >
              <div className={`w-8 h-8 rounded-full ${showHistory ? 'bg-rose-50 text-rose-600 rotate-45' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center transition-all duration-500`}>
                <FiPlus size={16} />
              </div>
              <span className="text-[14px] font-black uppercase tracking-[8px] text-gray-400 group-hover:text-indigo-600 transition-colors">
                {showHistory ? 'Hide Interaction History' : 'View Interaction History'}
              </span>
            </button>
          </div>

          {showHistory && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-12 px-4 font-inter">
                 <div className="flex gap-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
                    {['all', 'conversation', 'notes', 'activity'].map((tab) => (
                       <button
                         key={tab}
                         onClick={() => setChatterTab(tab)}
                         className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
                            chatterTab === tab 
                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                            : 'bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                         }`}
                       >
                          {tab === 'all' ? 'Timeline' : tab}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-8 pl-10 pr-4">
                 {activityLoading ? (
                    <div className="h-40 flex items-center justify-center">
                       <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                 ) : (() => {
                    const filtered = (activities || []).filter(item => {
                       if (chatterTab === 'all') return true;
                       if (chatterTab === 'conversation') return ['email', 'message', 'whatsapp'].includes(item.type);
                       if (chatterTab === 'notes') return item.type === 'note';
                       if (chatterTab === 'activity') return ['lead_stage_changed', 'system', 'lead_assignment_changed', 'lead', 'deal_stage_changed', 'follow_up'].includes(item.type);
                       return false;
                    });

                    if (filtered.length === 0) return (
                       <div className="text-center py-20 bg-white rounded-[40px] border border-gray-100 shadow-sm">
                          <FiInbox size={32} className="mx-auto text-gray-200 mb-4" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No activities found</p>
                       </div>
                    );

                    const groups = filtered.reduce((acc, item) => {
                       const dateLabel = getDateGroupKey(item.date);
                       if (!acc[dateLabel]) acc[dateLabel] = [];
                       acc[dateLabel].push(item);
                       return acc;
                    }, {});

                    return Object.entries(groups).map(([date, groupItems]) => (
                       <div key={date} className="relative pb-12">
                          <div className="sticky top-4 z-[5] mb-12 flex justify-center">
                             <span className="bg-white border border-gray-100 shadow-sm px-6 py-2 rounded-full text-[10px] font-black tracking-[3px] text-gray-400 uppercase">{date}</span>
                          </div>
                          <div className="space-y-12">
                             {groupItems.map((item, idx) => (
                                <ActivityItem key={item._id || idx} item={item} isLast={idx === groupItems.length - 1} />
                             ))}
                          </div>
                       </div>
                    ));
                 })()}
              </div>
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
  );
}

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiPhone, FiMail, FiCheckSquare, FiFileText, 
  FiMoreVertical, FiUser, FiCalendar, FiTarget, FiActivity,
  FiPaperclip, FiSend, FiClock, FiPlus, FiChevronRight,
  FiEdit3, FiEdit, FiFlag, FiTrash2, FiCheckCircle, FiInfo, FiLayers, FiStar, FiChevronLeft
} from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

// --- Components ---
const StageSwitcher = ({ stages, currentStage, onUpdate, loading }) => {
  return (
    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar">
      {stages.map((stage) => {
        const isCurrent = stage.name.toLowerCase() === (currentStage || "").toLowerCase();
        return (
          <button
            key={stage.name}
            onClick={() => onUpdate(stage.name)}
            disabled={loading || isCurrent}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap
              ${isCurrent 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-white'}`}
          >
            {stage.name}
          </button>
        );
      })}
    </div>
  );
};

const ActivityTimelineItem = ({ activity }) => {
  const getTypeConfig = (type) => {
    const config = {
      note: { icon: <FiFileText />, color: "text-amber-600", bg: "bg-amber-50" },
      call: { icon: <FiPhone />, color: "text-teal-600", bg: "bg-teal-50" },
      email: { icon: <FiMail />, color: "text-indigo-600", bg: "bg-indigo-50" },
      task: { icon: <FiCheckSquare />, color: "text-rose-600", bg: "bg-rose-50" },
      stage_change: { icon: <FiLayers />, color: "text-violet-600", bg: "bg-violet-50" },
      assignment: { icon: <FiUser />, color: "text-blue-600", bg: "bg-blue-50" },
      followup: { icon: <FiClock />, color: "text-indigo-600", bg: "bg-indigo-50" },
      system: { icon: <FiInfo />, color: "text-slate-600", bg: "bg-slate-50" },
    };
    return config[type.toLowerCase()] || config.system;
  };

  const config = getTypeConfig(activity.type);
  const date = new Date(activity.date || activity.createdAt).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  });

  return (
    <div className="relative pl-8 pb-8 last:pb-0 group">
      {/* Line */}
      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-100 group-last:hidden" />
      
      {/* Icon Node */}
      <div className={`absolute left-0 top-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm z-10 ${config.bg} ${config.color} border border-white`}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 uppercase">
              {activity.user ? activity.user[0] : 'S'}
            </div>
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{activity.user || 'System'}</span>
          </div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{date}</span>
        </div>

        <h3 className="text-xs font-bold text-slate-700 leading-relaxed">
          {activity.title || activity.note}
        </h3>

        {activity.note && activity.title && activity.title !== activity.note && (
          <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl italic">
            "{activity.note}"
          </p>
        )}

        {activity.mentionedUser && (
          <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-full w-fit">
            <FiUser size={10} className="text-indigo-600" />
            <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest">Tagged: {activity.mentionedUser}</span>
          </div>
        )}
        
        {activity.metadata?.subject && (
          <div className="mt-2 text-xs font-bold text-slate-500 italic flex items-center gap-2">
            <FiMail size={12} />
            Subject: {activity.metadata.subject}
          </div>
        )}

        {activity.attachments && activity.attachments.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
            {activity.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-600 whitespace-nowrap">
                <FiPaperclip size={10} /> {att.name || 'Attachment'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const socket = useSocket();
  const user = getCurrentUser();
  const roleBase = user?.role === "super_admin"
    ? "/superadmin"
    : user?.role === "branch_manager"
      ? "/branch"
      : user?.role === "sales"
        ? "/sales"
        : "/company";

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState({ stages: [] });
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState("description"); // description, extra, docs
  const [actionType, setActionType] = useState(null); 
  const [showHistory, setShowHistory] = useState(false);
  const [description, setDescription] = useState("");
  
  // Action Form States
  const [contactSource, setContactSource] = useState("");
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpType, setFollowUpType] = useState("Call");
  const [followUpNote, setFollowUpNote] = useState("");
  const [companyUsers, setCompanyUsers] = useState([]);
  const [mentionFilter, setMentionFilter] = useState("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionPos, setMentionPos] = useState({ x: 0, y: 0 });
  const [selectedMentions, setSelectedMentions] = useState([]);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [taskData, setTaskData] = useState({ title: "", dueDate: "", priority: "Medium" });
  const [callData, setCallData] = useState({ duration: "", result: "Connected", summary: "" });
  const [updating, setUpdating] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(false);

  // Chat
  const [chatConversation, setChatConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newChatMsg, setNewChatMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef(null);

  const [prevLeadId, setPrevLeadId] = useState(null);
  const [nextLeadId, setNextLeadId] = useState(null);
  
  // Tags
  const [newTag, setNewTag] = useState("");

  // Extra Info Edit States
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isEditingMarketing, setIsEditingMarketing] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingAcademic, setIsEditingAcademic] = useState(false);
  
  // Extra Info Form States
  const [companyFields, setCompanyFields] = useState({ companyName: "", website: "", industry: "", companySize: "" });
  const [marketingFields, setMarketingFields] = useState({ source: "", campaign: "", medium: "" });
  const [locationFields, setLocationFields] = useState({ city: "", address: "", location: "" });
  const [academicFields, setAcademicFields] = useState({ course: "", courseSelected: "", testScore: 0 });

  const fetchNeighbors = useCallback(async (currentLead) => {
    try {
      // Small optimization: fetch surrounding lead IDs for navigation
      const res = await API.get(`/leads?limit=1000`); // Fetch recent IDs
      const allLeads = res.data.data || [];
      const currentIndex = allLeads.findIndex(l => l._id === currentLead._id);
      
      if (currentIndex !== -1) {
        setPrevLeadId(currentIndex > 0 ? allLeads[currentIndex - 1]._id : null);
        setNextLeadId(currentIndex < allLeads.length - 1 ? allLeads[currentIndex + 1]._id : null);
      }
    } catch (e) {
      console.warn("Navigation fetch failed", e);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const leadRes = await API.get(`/leads/${id}`);
      const leadData = leadRes.data?.data;
      const entityType = leadRes.data?.entityType || leadData?.type;

      if (entityType === "INQUIRY") {
        toast.info("This record is an inquiry. Opening the inquiry workspace instead.");
        navigate(`${roleBase}/inquiries/${id}`, { replace: true });
        return;
      }

      const [pipeRes, actRes, taskRes, userRes] = await Promise.all([
        API.get("/leads/pipeline"),
        API.get(`/activities/timeline?leadId=${id}`),
        API.get(`/tasks?leadId=${id}`),
        API.get("/users/assignable")
      ]);
      setLead(leadData);
      setDescription(leadData.notes || "");
      
      // Initialize Edit States
      setCompanyFields({
        companyName: leadData.companyName || "",
        website: leadData.website || "",
        industry: leadData.industry || "",
        companySize: leadData.companySize || ""
      });
      setMarketingFields({
        source: leadData.source || "",
        campaign: leadData.campaign || "",
        medium: leadData.medium || ""
      });
      setLocationFields({
        city: leadData.city || "",
        address: leadData.address || "",
        location: leadData.location || ""
      });
      setAcademicFields({
        course: leadData.course || "",
        courseSelected: leadData.courseSelected || "",
        testScore: leadData.testScore || 0
      });

      setPipeline(pipeRes.data.pipeline || { stages: [] });
      setActivities(actRes.data.data);
      setTasks(taskRes.data.data || []);
      setCompanyUsers(userRes.data.data || []);
      setTaskData(prev => ({ ...prev, dueDate: new Date().toISOString().split('T')[0] }));
      
      // Load neighbors
      fetchNeighbors(leadData);
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          await API.get(`/inquiries/${id}`);
          toast.info("This record is an inquiry. Opening the inquiry workspace instead.");
          navigate(`${roleBase}/inquiries/${id}`, { replace: true });
          return;
        } catch (inquiryErr) {
          if (inquiryErr.response?.status !== 404) {
            console.error("Inquiry fallback failed:", inquiryErr);
          }
        }
      }
      toast.error("Failed to load lead workspace.");
    } finally {
      setLoading(false);
    }
  }, [id, toast, fetchNeighbors, navigate, roleBase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateDescription = async () => {
    try {
      setUpdating(true);
      const res = await API.patch(`/leads/${id}`, { notes: description });
      setLead(res.data.data);
      toast.success("Description updated!");
    } catch (err) {
      toast.error("Failed to update description.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveExtra = async (fields, setEditing) => {
    try {
      setUpdating(true);
      const res = await API.patch(`/leads/${id}`, fields);
      setLead(res.data.data);
      setEditing(false);
      toast.success("Lead details updated!");
    } catch {
      toast.error("Update failed.");
    } finally {
      setUpdating(false);
    }
  };
  useEffect(() => {
    if (activeTab !== 'chat' || !id) return;
    let mounted = true;
    const loadChat = async () => {
      setChatLoading(true);
      try {
        const convRes = await API.get(`/chat/lead/${id}`);
        const conv = convRes.data.data;
        if (!mounted) return;
        setChatConversation(conv);
        const msgRes = await API.get(`/chat/${conv._id}/messages`);
        if (!mounted) return;
        const populated = (msgRes.data.data || []).map(m => ({
          ...m,
          senderId: m.senderId || { _id: m.senderId, name: 'User' }
        }));
        setChatMessages(populated);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } catch { toast.error("Failed to load chat."); }
      finally { if (mounted) setChatLoading(false); }
    };
    loadChat();
    return () => { mounted = false; };
  }, [activeTab, id, toast]);

  const handleUpdateStage = async (newStage) => {
    try {
      setUpdating(true);
      const res = await API.patch(`/leads/${id}/stage`, { status: newStage });
      setLead(res.data.data);
      toast.success(`Stage updated to ${newStage}`);
      // Refresh timeline
      const actRes = await API.get(`/activities/timeline?leadId=${id}`);
      setActivities(actRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stage");
    } finally {
      setUpdating(false);
    }
  };

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNoteContent(val);
    const lastWord = val.split(/[ \n]/).pop();
    if (lastWord.startsWith("@")) {
      const filter = lastWord.slice(1).toLowerCase();
      setMentionFilter(filter);
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (user) => {
    const parts = noteContent.split(/[ \n]/);
    parts.pop();
    setNoteContent(parts.join(" ") + (parts.length > 0 ? " " : "") + `@${user.name} `);
    setSelectedMentions(prev => [...new Set([...prev, user._id])]);
    setShowMentionDropdown(false);
  };

  const markTaskDone = async (taskId) => {
    try {
      await API.patch(`/tasks/${taskId}`, { status: 'Completed' });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: 'Completed' } : t));
      toast.success('Task marked as done!');
    } catch { toast.error('Failed to update task.'); }
  };

  const submitAction = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      let res;
      if (actionType === 'note') {
        const response = await API.post(`/leads/${id}/interactions`, { 
          type: "note", 
          message: noteContent,
          metadata: { mentions: selectedMentions } 
        });
        setNoteContent("");
        setSelectedMentions([]);
        // Optimistic refresh
        setActivities(prev => [response.data.data, ...prev]);
      } else if (actionType === 'call') {
        const response = await API.post(`/leads/${id}/interactions`, { 
          type: "call", 
          message: `Call Logged: ${callData.summary}`,
          metadata: { duration: callData.duration, result: callData.result }
        });
        setCallData({ duration: "", result: "Connected", summary: "" });
        // Optimistic refresh
        setActivities(prev => [response.data.data, ...prev]);
      } else if (actionType === 'task') {
        res = await API.post(`/leads/${id}/tasks`, taskData);
        setTaskData({ title: "", dueDate: new Date().toISOString().split('T')[0], priority: "Medium" });
      } else if (actionType === 'followup') {
        res = await API.patch(`/leads/${id}/follow-up`, { 
          nextFollowUpDate: followUpDate,
          followUpType: followUpType,
          followUpNote: followUpNote
        });
        setLead(prev => ({ 
          ...prev, 
          nextFollowUpDate: res.data.data.nextFollowUpDate, 
          followUpStatus: res.data.data.followUpStatus,
          extraInfo: res.data.data.extraInfo
        }));
        setFollowUpDate(new Date().toISOString().split('T')[0]);
        setFollowUpNote("");
      }
      
      // Update UI Instantly
      if (res?.data?.data) {
        setActivities(prev => [res.data.data, ...prev]);
      } else if (actionType !== 'followup') {
        // Refresh if not returned
        const actRes = await API.get(`/activities/timeline?leadId=${id}`);
        setActivities(actRes.data.data);
      }
      
      if (actionType !== 'followup' && actionType !== 'task') toast.success("Activity logged!");
      setActionType(null);
      if (actionType === 'task') {
        const tRes = await API.get(`/tasks?leadId=${id}`);
        setTasks(tRes.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to log interaction.");
    } finally {
      setUpdating(false);
    }
  };

  const addTag = async (e) => {
    if (e) e.preventDefault();
    if (!newTag.trim()) return;
    try {
      const res = await API.patch(`/leads/${id}/tags`, { add: [newTag.trim()] });
      setLead(prev => ({ ...prev, tags: res.data.data.tags }));
      setNewTag("");
      toast.success("Tag added.");
    } catch { toast.error("Failed to add tag."); }
  };

  const removeTag = async (tag) => {
    try {
      const res = await API.patch(`/leads/${id}/tags`, { remove: [tag] });
      setLead(prev => ({ ...prev, tags: res.data.data.tags }));
      toast.success("Tag removed.");
    } catch { toast.error("Failed to remove tag."); }
  };

  const scheduleFollowUp = async (e) => {
    if (e) e.preventDefault();
    if (!followUpDate) return toast.error("Please select a date.");
    try {
      const res = await API.patch(`/leads/${id}/follow-up`, { nextFollowUpDate: followUpDate });
      setLead(prev => ({ ...prev, nextFollowUpDate: res.data.data.nextFollowUpDate, followUpStatus: res.data.data.followUpStatus }));
      setFollowUpDate("");
      setActionType(null);
      toast.success("Follow-up scheduled.");
    } catch { toast.error("Failed to schedule follow-up."); }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-lg shadow-indigo-600/10" />
    </div>
  );

  if (!lead) return (
    <div className="flex flex-col h-screen items-center justify-center p-6 text-center">
      <FiInfo size={48} className="text-slate-300 mb-4" />
      <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Lead not found</h2>
      <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-inter pb-20 animate-fade-in">
        {/* --- TOP HEADER NAVIGATION --- */}
        <div className="bg-white px-8 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 focus:outline-none">
                    <FiArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-100/80 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200/50">
                        {lead.customId}
                    </span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
                        AGENT: {lead.assignedTo?.name?.split(' ')[0]?.toUpperCase() || 'SYSTEM'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl mr-4 border border-slate-100">
                    {(pipeline.stages || []).map(stage => {
                        const isCurrent = (lead.stage || "").toLowerCase() === (stage.name || "").toLowerCase();
                        const st = (stage.name || "").toUpperCase();
                        
                        // Dynamic color mapping for aesthetics matching the image
                        const btnColors = {
                            'WON': isCurrent ? 'bg-emerald-500 text-white' : 'text-emerald-600 hover:bg-emerald-50',
                            'LOST': isCurrent ? 'bg-rose-500 text-white' : 'text-rose-600 hover:bg-rose-50',
                            'KNOCK': isCurrent ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200',
                            'DEFAULT': isCurrent ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-white'
                        };

                        const colorClass = btnColors[st] || btnColors.DEFAULT;

                        return (
                            <button 
                                key={stage._id || stage.name} 
                                onClick={() => handleUpdateStage(stage.name)}
                                disabled={updating || isCurrent}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${colorClass}`}>
                                {st}
                            </button>
                        );
                    })}
                </div>
                {/* Navigation Arrows */}
                <div className="flex items-center gap-1 border-l border-slate-100 pl-4 pointer-events-auto">
                    <button 
                        onClick={() => prevLeadId && navigate(`${roleBase}/leads/${prevLeadId}`)}
                        disabled={!prevLeadId}
                        className={`p-2 transition-colors ${prevLeadId ? 'text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}>
                        <FiChevronLeft size={16} strokeWidth={3} />
                    </button>
                    <button 
                        onClick={() => nextLeadId && navigate(`${roleBase}/leads/${nextLeadId}`)}
                        disabled={!nextLeadId}
                        className={`p-2 transition-colors ${nextLeadId ? 'text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}>
                        <FiChevronRight size={16} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>

        <div className="max-w-[1500px] mx-auto px-8 pt-10">
            {/* --- MAIN IDENTIFIER SECTION --- */}
            <div className="mb-12">
                <div className="flex items-center gap-4 mb-3">
                    <h1 className="text-[32px] font-bold text-slate-900 tracking-tight poppins">{lead.name}'s opportunity</h1>
                    <div className="flex items-center gap-0.5 text-amber-400">
                        {[1,2,3,4,5].map(s => (
                            <FiStar size={16} key={s} className={s <= (lead.priorityStars || 0) ? 'fill-amber-400' : 'text-slate-200'} />
                        ))}
                    </div>
                    <span className="ml-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black tracking-widest uppercase border border-slate-200">ENGAGEMENT</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                    <FiUser size={14} className="text-slate-400" />
                    <span>Working on this: <span className="text-indigo-600 font-bold">{lead.assignedTo?.name || 'Unassigned'}</span></span>
                </div>
            </div>

            {/* --- INFO GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-16">
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-2">Expected Revenue</p>
                            <p className="text-lg font-bold text-slate-800 poppins">{lead.expectedRevenue ? `INR ${lead.expectedRevenue.toLocaleString()}` : (lead.value ? `INR ${lead.value.toLocaleString()}` : "0.00")}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-2">Probability</p>
                            <p className="text-lg font-bold text-slate-800">{lead.probability?.toFixed(2) || '10.00'} %</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-10">
                            <span className="w-24 text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Contact</span>
                            <span className="text-sm font-bold text-teal-600 hover:underline cursor-pointer">{lead.name}</span>
                        </div>
                        <div className="flex items-start gap-10">
                            <span className="w-24 text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Email</span>
                            <span className="text-sm font-bold text-teal-600 hover:underline cursor-pointer">{lead.email}</span>
                        </div>
                        <div className="flex items-start gap-10">
                            <span className="w-24 text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Phone</span>
                            <span className="text-sm font-bold text-slate-700">{lead.phone || '—'}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="flex items-start gap-10">
                        <span className="w-32 text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Assigned To</span>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                                {lead.assignedTo?.name?.[0] || 'U'}
                            </div>
                            <span className="text-sm font-bold text-slate-800 uppercase tracking-tight leading-none">{lead.assignedTo?.name || 'Pending Distribution'}</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-10">
                        <span className="w-32 text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Expected Closing</span>
                        <span className="text-sm font-bold text-slate-800">{lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                    </div>
                    <div className="flex items-start gap-10">
                        <span className="w-32 text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Tags</span>
                        <div className="flex flex-wrap gap-2">
                            {(lead.tags || []).map(t => (
                                <span key={t} className="px-3 py-1 bg-slate-50 border border-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">{t}</span>
                            ))}
                            {(lead.tags || []).length === 0 && <span className="text-[10px] text-slate-300 italic uppercase font-bold">No Tags Defined</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- QUICK ACTION BAR --- */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/20 p-3 flex items-center gap-2 mb-10 overflow-x-auto no-scrollbar">
                {[
                    { id: 'task', label: 'New Task', icon: <FiCheckSquare />, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { id: 'meeting', label: 'Meeting', icon: <FiCalendar />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                    { id: 'note', label: 'Add Note', icon: <FiEdit3 />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { id: 'email', label: 'Send Email', icon: <FiMail />, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { id: 'followup', label: 'Schedule Follow-up', icon: <FiClock />, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { id: 'docs', label: 'Attach Doc', icon: <FiPaperclip />, color: 'text-blue-500', bg: 'bg-blue-50' },
                ].map(act => (
                    <button 
                        key={act.id} 
                        onClick={() => {
                            if (act.id === 'meeting') {
                                navigate(`${roleBase}/meetings`, {
                                    state: {
                                        prefillMeeting: {
                                            leadId: lead._id,
                                            contactName: lead.name || "",
                                            contactEmail: lead.email || "",
                                            contactPhone: lead.phone || "",
                                            title: `${lead.name || "Lead"} Meeting`,
                                            notes: `Follow-up meeting for ${lead.name || "selected lead"}.`,
                                            assignedTo: lead.assignedTo?._id || lead.assignedTo || user?.id || "",
                                        },
                                    },
                                });
                                return;
                            }
                            if (act.id === 'email') {
                                navigate(`${roleBase}/mass-messaging/create`, {
                                    state: {
                                        prefillCampaign: {
                                            channel: "EMAIL",
                                            audienceType: "LEADS",
                                            recipientMode: "SELECTED",
                                            recipients: [lead._id],
                                            name: `${lead.name || "Lead"} Email`,
                                            senderName: user?.name || "",
                                            senderEmail: user?.email || "",
                                        },
                                    },
                                });
                                return;
                            }
                            setActionType(act.id === 'docs' ? null : act.id);
                            if(act.id === 'docs') setActiveTab('docs');
                        }}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${actionType === act.id ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50 group'}`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-all ${actionType === act.id ? 'bg-white/20 text-white' : `${act.bg} ${act.color} group-hover:scale-110`}`}>
                            {act.icon}
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-widest ${actionType === act.id ? 'text-white' : 'text-slate-500'}`}>{act.label}</span>
                    </button>
                ))}
            </div>

            {/* --- ACTION EDITOR (INLINE) --- */}
            {actionType && (
                <div className="mb-10 bg-slate-50/50 rounded-[32px] p-8 border border-slate-100 animate-in slide-in-from-top-4 duration-300">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-inter">Setup {actionType}</h3>
                        <button onClick={() => setActionType(null)} className="text-slate-400 hover:text-rose-500 transition-colors"><FiPlus className="rotate-45" size={24} /></button>
                     </div>
                     <form onSubmit={submitAction}>
                        {actionType === 'note' && (
                            <div className="relative">
                                <textarea 
                                  value={noteContent} 
                                  onChange={handleNoteChange} 
                                  placeholder="Type internal note here, use @ to tag a teammate..." 
                                  className="w-full h-24 bg-white rounded-2xl p-6 text-sm font-medium border border-slate-100 focus:border-indigo-200 outline-none shadow-sm" 
                                  required 
                                />
                                {showMentionDropdown && (
                                    <div className="absolute z-50 bottom-full left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="p-3 bg-slate-50 border-b border-slate-100">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tag Teammates</div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {companyUsers.filter(u => u.name.toLowerCase().includes(mentionFilter)).map(u => (
                                                <button
                                                    key={u._id}
                                                    type="button"
                                                    onClick={() => handleMentionSelect(u)}
                                                    className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                                                        {u.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">{u.name}</p>
                                                        <p className="text-[10px] text-slate-400">{u.role}</p>
                                                    </div>
                                                </button>
                                            ))}
                                            {companyUsers.filter(u => u.name.toLowerCase().includes(mentionFilter)).length === 0 && (
                                                <div className="p-4 text-center text-[10px] font-bold text-slate-300 italic uppercase">No users found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {actionType === 'task' && (
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Task Title" value={taskData.title} onChange={(e) => setTaskData({...taskData, title: e.target.value})} className="w-full bg-white rounded-2xl p-4 text-sm font-bold border border-slate-100 outline-none" required />
                                <input type="date" value={taskData.dueDate} onChange={(e) => setTaskData({...taskData, dueDate: e.target.value})} className="w-full bg-white rounded-2xl p-4 text-sm font-bold border border-slate-100 outline-none" required />
                            </div>
                        )}
                        {actionType === 'followup' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Follow-up Date</label>
                                        <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-full bg-white rounded-2xl p-4 text-sm font-bold border border-slate-100 outline-none" required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Method</label>
                                        <select value={followUpType} onChange={(e) => setFollowUpType(e.target.value)} className="w-full bg-white rounded-2xl p-4 text-sm font-bold border border-slate-100 outline-none">
                                            <option>Call</option>
                                            <option>WhatsApp</option>
                                            <option>Email</option>
                                            <option>Meeting</option>
                                        </select>
                                    </div>
                                </div>
                                <textarea value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} placeholder="What's the goal for this next contact?" className="w-full h-24 bg-white rounded-2xl p-6 text-sm font-medium border border-slate-100 focus:border-indigo-200 outline-none shadow-sm" />
                            </div>
                        )}
                        <div className="mt-6 flex justify-end">
                            <button type="submit" disabled={updating} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.15em] shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-all disabled:opacity-50">
                                {updating ? 'Syncing...' : 'Confirm Action'}
                            </button>
                        </div>
                     </form>
                </div>
            )}

            {/* --- TABBED WORKSPACE --- */}
            <div>
                <div className="flex items-center gap-10 border-b border-slate-50 px-4 mb-8">
                    {[
                        { id: 'description', label: 'Description' },
                        { id: 'extra', label: 'Extra Info' },
                        { id: 'docs', label: 'Attachments' }
                    ].map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => setActiveTab(t.id)}
                            className={`pb-4 text-[11px] font-black uppercase tracking-[0.25em] transition-all relative ${activeTab === t.id ? 'text-teal-600' : 'text-slate-300 hover:text-slate-500'}`}>
                            {t.label}
                            {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 rounded-t-full" />}
                        </button>
                    ))}
                </div>

                <div>
                    {activeTab === 'description' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter Internal lead description, situational context, or important context here..."
                                className="w-full h-[180px] p-6 bg-white border border-slate-50 rounded-2xl text-slate-600 font-medium text-sm leading-relaxed outline-none focus:ring-2 focus:ring-indigo-50 transition-all resize-none shadow-sm"
                            />
                            <div className="flex justify-end items-center gap-4">
                                <button 
                                    onClick={() => setShowHistory(!showHistory)}
                                    className={`h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border ${showHistory ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'}`}>
                                    {showHistory ? 'HIDE TIMELINE' : `SHOW TIMELINE (${activities.length})`}
                                </button>
                                <button 
                                    onClick={handleUpdateDescription}
                                    disabled={updating}
                                    className="h-10 px-8 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                                    Update Description
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'extra' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* 4-Column Editable Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                                {/* COLUMN 1: COMPANY */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Company</h4>
                                        <button 
                                            onClick={() => isEditingCompany ? handleSaveExtra(companyFields, setIsEditingCompany) : setIsEditingCompany(true)}
                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                                            {isEditingCompany ? 'SAVE' : 'EDIT'}
                                        </button>
                                    </div>
                                    <div className="space-y-5">
                                        {[
                                            { label: 'Name', key: 'companyName', state: companyFields, setState: setCompanyFields },
                                            { label: 'Website', key: 'website', state: companyFields, setState: setCompanyFields },
                                            { label: 'Industry', key: 'industry', state: companyFields, setState: setCompanyFields },
                                            { label: 'Size', key: 'companySize', state: companyFields, setState: setCompanyFields }
                                        ].map(f => (
                                            <div key={f.key}>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-2">{f.label}</p>
                                                {isEditingCompany ? (
                                                    <input 
                                                        type="text" 
                                                        value={f.state[f.key]} 
                                                        onChange={(e) => f.setState({...f.state, [f.key]: e.target.value})}
                                                        className="w-full bg-slate-50 p-2 rounded-lg text-xs font-bold border border-slate-100 focus:bg-white outline-none"
                                                    />
                                                ) : (
                                                    <p className={`text-xs font-bold ${f.key === 'website' ? 'text-teal-600' : 'text-slate-700'}`}>{lead[f.key] || '—'}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* COLUMN 2: MARKETING */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Marketing</h4>
                                        <button 
                                            onClick={() => isEditingMarketing ? handleSaveExtra(marketingFields, setIsEditingMarketing) : setIsEditingMarketing(true)}
                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                                            {isEditingMarketing ? 'SAVE' : 'EDIT'}
                                        </button>
                                    </div>
                                    <div className="space-y-5">
                                        {[
                                            { label: 'Source', key: 'source', state: marketingFields, setState: setMarketingFields },
                                            { label: 'Campaign', key: 'campaign', state: marketingFields, setState: setMarketingFields },
                                            { label: 'Medium', key: 'medium', state: marketingFields, setState: setMarketingFields }
                                        ].map(f => (
                                            <div key={f.key}>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-2">{f.label}</p>
                                                {isEditingMarketing ? (
                                                    <input 
                                                        type="text" 
                                                        value={f.state[f.key]} 
                                                        onChange={(e) => f.setState({...f.state, [f.key]: e.target.value})}
                                                        className="w-full bg-slate-50 p-2 rounded-lg text-xs font-bold border border-slate-100 focus:bg-white outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-xs font-bold text-slate-700">{lead[f.key] || '—'}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* COLUMN 3: LOCATION */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Location</h4>
                                        <button 
                                            onClick={() => isEditingLocation ? handleSaveExtra(locationFields, setIsEditingLocation) : setIsEditingLocation(true)}
                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                                            {isEditingLocation ? 'SAVE' : 'EDIT'}
                                        </button>
                                    </div>
                                    <div className="space-y-5">
                                        {[
                                            { label: 'City', key: 'city', state: locationFields, setState: setLocationFields },
                                            { label: 'Address', key: 'address', state: locationFields, setState: setLocationFields },
                                            { label: 'Region/Location', key: 'location', state: locationFields, setState: setLocationFields }
                                        ].map(f => (
                                            <div key={f.key}>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-2">{f.label}</p>
                                                {isEditingLocation ? (
                                                    <input 
                                                        type="text" 
                                                        value={f.state[f.key]} 
                                                        onChange={(e) => f.setState({...f.state, [f.key]: e.target.value})}
                                                        className="w-full bg-slate-50 p-2 rounded-lg text-xs font-bold border border-slate-100 focus:bg-white outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-xs font-bold text-slate-700">{lead[f.key] || '—'}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* COLUMN 4: ACADEMIC */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Academic</h4>
                                        <button 
                                            onClick={() => isEditingAcademic ? handleSaveExtra(academicFields, setIsEditingAcademic) : setIsEditingAcademic(true)}
                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                                            {isEditingAcademic ? 'SAVE' : 'EDIT'}
                                        </button>
                                    </div>
                                    <div className="space-y-5">
                                        {[
                                            { label: 'Course Preference', key: 'course', state: academicFields, setState: setAcademicFields },
                                            { label: 'Degree Type', key: 'courseSelected', state: academicFields, setState: setAcademicFields },
                                            { label: 'Test Score/GPA', key: 'testScore', state: academicFields, setState: setAcademicFields }
                                        ].map(f => (
                                            <div key={f.key}>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-2">{f.label}</p>
                                                {isEditingAcademic ? (
                                                    <input 
                                                        type="text" 
                                                        value={f.state[f.key]} 
                                                        onChange={(e) => f.setState({...f.state, [f.key]: e.target.value})}
                                                        className="w-full bg-slate-50 p-2 rounded-lg text-xs font-bold border border-slate-100 focus:bg-white outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-xs font-bold text-slate-700">{lead[f.key] || '—'}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Tag Management */}
                            <div className="bg-white border border-slate-100 p-10 rounded-[40px] shadow-sm mt-12">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Pipeline Tags & Labels</h4>
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {(lead.tags || []).map(t => (
                                        <span key={t} className="flex items-center gap-2 pl-4 pr-2 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-bold border border-indigo-100">
                                            {t}
                                            <button onClick={() => removeTag(t)} className="w-5 h-5 rounded-lg hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
                                                <FiPlus className="rotate-45" size={14} />
                                            </button>
                                        </span>
                                    ))}
                                    {(lead.tags || []).length === 0 && <span className="text-xs text-slate-300 italic">No labels assigned yet. Use the field below to add one.</span>}
                                </div>
                                <form onSubmit={addTag} className="flex gap-4">
                                    <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Type a tag name (e.g. WEBSITE, GOOGLE-ADS)..." className="flex-1 px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all" />
                                    <button type="submit" className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Add Label</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'docs' && (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-300 bg-slate-50/30 rounded-[40px] border border-dashed border-slate-200">
                            <FiPaperclip size={48} className="mb-4 opacity-20" />
                            <p className="text-xs font-black uppercase tracking-widest">No documentation attached</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ACTIVITY FEED --- */}
            {showHistory && (
                <div className="w-full mx-auto pb-8 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-50 pt-2">
                    <div className="space-y-3 pl-8 border-l border-slate-100/50 ml-6 relative w-full">
                        {activities.length > 0 ? (
                            activities.map((act, i) => (
                                <div key={act._id || i} className="relative pb-3 last:pb-0 group w-full">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[37px] top-0 w-3 h-3 bg-white border border-indigo-500 rounded-full z-10 group-hover:scale-125 transition-transform" />
                                    
                                    <div className="flex justify-between items-start mb-0.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[9px] font-black uppercase shadow-sm">
                                                {(act.user || 'S')[0]}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[11px] font-extrabold text-slate-800">{act.user || 'System'}</p>
                                                    <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                                                        act.type === 'note' ? 'bg-emerald-50 text-emerald-600' :
                                                        act.type === 'call' ? 'bg-indigo-50 text-indigo-600' :
                                                        act.type === 'stage_changed' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-slate-50 text-slate-400'
                                                    }`}>
                                                        {act.type}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">
                                                    {new Date(act.date || act.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-1 p-2.5 bg-white border border-slate-50 rounded-xl shadow-sm hover:border-slate-100 transition-colors w-full">
                                        <p className="text-[12px] font-medium text-slate-600 leading-normal italic">"{act.note || act.title || act.message}"</p>
                                        {act.metadata && Object.keys(act.metadata).length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-slate-50 flex gap-3">
                                                {Object.entries(act.metadata).map(([k, v]) => (
                                                    <div key={k} className="flex flex-col">
                                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter">{k}</span>
                                                        <span className="text-[9px] font-bold text-slate-500">{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                                <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.3em]">Ready for action</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}

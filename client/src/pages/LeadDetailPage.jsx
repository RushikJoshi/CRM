import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiPhone, FiMail, FiCheckSquare, FiFileText, 
  FiMoreVertical, FiUser, FiCalendar, FiTarget, FiActivity,
  FiPaperclip, FiSend, FiClock, FiPlus, FiChevronRight,
  FiEdit3, FiEdit, FiFlag, FiTrash2, FiCheckCircle, FiInfo, FiLayers
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

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState({ stages: [] });
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState("timeline");
  const [actionType, setActionType] = useState(null); // 'note', 'call', 'task', 'email'
  
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

  const [emailData, setEmailData] = useState({ subject: "", body: "" });
  // Tags
  const [newTag, setNewTag] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadRes, pipeRes, actRes, taskRes, userRes] = await Promise.all([
        API.get(`/leads/${id}`),
        API.get("/leads/pipeline"),
        API.get(`/activities/timeline?leadId=${id}`),
        API.get(`/tasks?leadId=${id}`),
        API.get("/users/assignable")
      ]);
      setLead(leadRes.data.data);
      setPipeline(pipeRes.data.pipeline || { stages: [] });
      setActivities(actRes.data.data);
      setTasks(taskRes.data.data || []);
      setCompanyUsers(userRes.data.data || []);
      setTaskData(prev => ({ ...prev, dueDate: new Date().toISOString().split('T')[0] }));
    } catch (err) {
      toast.error("Failed to load lead workspace.");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chat tab: fetch/create lead conversation + subscribe to socket room
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
      } else if (actionType === 'email') {
        res = await API.post(`/email/send`, { 
          leadId: id, 
          subject: emailData.subject, 
          body: emailData.body 
        });
        setEmailData({ subject: "", body: "" });
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
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  if (!lead) return (
    <div className="flex flex-col h-screen items-center justify-center bg-slate-50 p-6 text-center">
      <FiInfo size={48} className="text-slate-300 mb-4" />
      <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Lead not found</h2>
      <p className="text-sm font-medium text-slate-500 mt-2 mb-6">We couldn't retrieve the workspace data. The record might have be deleted or restricted.</p>
      <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-inter">
      {/* SECTION 1: STICKY HEADER */}
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-200 px-6 py-4 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100">
                <FiArrowLeft size={20} />
             </button>
             <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{lead?.name || 'Loading...'}</h1>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">{lead.customId}</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.email}</span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end min-w-0">
             <div className="hidden lg:block flex-1 max-w-lg">
                <StageSwitcher 
                   stages={pipeline.stages} 
                   currentStage={lead.stage} 
                   onUpdate={handleUpdateStage}
                   loading={updating}
                />
             </div>
             
             <div className="h-10 w-px bg-slate-100 hidden sm:block" />

             <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                   <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Probability</div>
                   <div className="text-lg font-black text-indigo-600 leading-none">{lead.probability}%</div>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 text-white font-black text-xs shadow-lg shadow-slate-200">
                   {lead.assignedTo?.name?.[0] || 'U'}
                </div>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Lead Profile & Details */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative group">
                <button 
                   onClick={() => setShowProfileDrawer(true)} 
                   className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                 >
                    <FiEdit size={14} />
                 </button>
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-16 h-16 rounded-[24px] bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-indigo-100">
                      {(lead.name || 'L')[0].toUpperCase()}
                   </div>
                   <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Company Detail</div>
                      <div className="text-lg font-bold text-slate-900">{lead.companyName || 'Private Lead'}</div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Value</div>
                      <div className="text-sm font-black text-slate-900">₹{lead.expectedRevenue?.toLocaleString() || '0'}</div>
                   </div>
                   <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Source</div>
                      <div className="text-sm font-black text-indigo-600">{lead.source || 'Manual'}</div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Phone Number</label>
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                         <span className="text-sm font-bold text-slate-700">{lead.phone || 'N/A'}</span>
                         <a href={`tel:${lead.phone}`} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><FiPhone size={14} /></a>
                      </div>
                   </div>
                   <div className="group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Email Address</label>
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                         <span className="text-sm font-bold text-slate-700 truncate mr-4">{lead.email}</span>
                         <a href={`mailto:${lead.email}`} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><FiMail size={14} /></a>
                      </div>
                   </div>
                </div>
             </div>

             {/* Tags */}
             <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tags</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(lead.tags || []).map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-bold">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-1 text-indigo-400 hover:text-red-500 font-black">×</button>
                    </span>
                  ))}
                  {(lead.tags || []).length === 0 && <span className="text-xs text-slate-300 italic">No tags yet</span>}
                </div>
                <form onSubmit={addTag} className="flex gap-2">
                  <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add tag..." className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-100" />
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black">Add</button>
                </form>
             </div>

             {/* Follow-up badge */}
             {lead.nextFollowUpDate && (
               <div className={`rounded-[24px] p-5 border flex items-center justify-between ${lead.followUpStatus === 'OVERDUE' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                 <div>
                   <div className="text-[10px] font-black uppercase tracking-widest mb-1 ${lead.followUpStatus === 'OVERDUE' ? 'text-red-500' : 'text-amber-600'}">Follow-up {lead.followUpStatus}</div>
                   <div className="text-sm font-bold text-slate-900">{new Date(lead.nextFollowUpDate).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</div>
                 </div>
                 <FiClock size={20} className={lead.followUpStatus === 'OVERDUE' ? 'text-red-400' : 'text-amber-400'} />
               </div>
             )}
          </div>

          {/* RIGHT COLUMN: ACTION BAR & WORKSPACE */}
          <div className="lg:col-span-8 space-y-6">
             
             {/* SECTION 2: ACTION BAR */}
             <div className="bg-white rounded-[32px] p-4 border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
                <button onClick={() => setActionType('note')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${actionType === 'note' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}>
                   <FiEdit3 /> Note
                </button>
                <button onClick={() => setActionType('call')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${actionType === 'call' ? 'bg-teal-600 text-white shadow-lg shadow-teal-200' : 'text-slate-500 hover:bg-slate-50'}`}>
                   <FiPhone /> Call
                </button>
                <button onClick={() => setActionType('task')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${actionType === 'task' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'text-slate-500 hover:bg-slate-50'}`}>
                   <FiCheckSquare /> Task
                </button>
                <button onClick={() => setActionType('email')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${actionType === 'email' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}>
                   <FiSend /> Email
                </button>
                <button onClick={() => setActionType('followup')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${actionType === 'followup' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'text-slate-500 hover:bg-slate-50'}`}>
                   <FiClock /> Follow-up
                </button>
             </div>

             {/* Action Editor */}
             {actionType && (
               <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">New {actionType}</h3>
                     <button onClick={() => setActionType(null)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><FiPlus className="rotate-45" size={24} /></button>
                  </div>
                  
                  <form onSubmit={submitAction}>
                    {actionType === 'note' && (
                      <div className="relative">
                         <textarea 
                            value={noteContent}
                            onChange={handleNoteChange}
                            placeholder="Type @ to tag a teammate..."
                            className="w-full h-32 bg-slate-50 rounded-2xl p-4 text-sm font-medium border-transparent focus:bg-white transition-all shadow-sm"
                            required
                         />
                         {showMentionDropdown && (
                           <div className="absolute z-50 bottom-full left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden mb-2 animate-in fade-in slide-in-from-bottom-2">
                             <div className="p-3 bg-slate-50 border-b border-slate-100">
                               <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tag Teammates</div>
                             </div>
                             <div className="max-h-48 overflow-y-auto">
                               {companyUsers.filter(u => u.name.toLowerCase().includes(mentionFilter)).map(user => (
                                 <button
                                   key={user._id}
                                   onClick={() => handleMentionSelect(user)}
                                   className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                                 >
                                   <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                                     {user.name[0]}
                                   </div>
                                   <div>
                                     <div className="text-xs font-bold text-slate-700">{user.name}</div>
                                     <div className="text-[10px] text-slate-400">{user.role}</div>
                                   </div>
                                 </button>
                               ))}
                             </div>
                           </div>
                         )}
                      </div>
                    )}

                    {actionType === 'call' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-4">
                            <select 
                               value={callData.result}
                               onChange={(e) => setCallData({...callData, result: e.target.value})}
                               className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold border-transparent focus:bg-white transition-all shadow-sm">
                               <option>Connected</option>
                               <option>Busy</option>
                               <option>No Answer</option>
                               <option>Wrong Number</option>
                            </select>
                            <input 
                              type="text" 
                              placeholder="Duration (e.g. 5m)" 
                              value={callData.duration}
                              onChange={(e) => setCallData({...callData, duration: e.target.value})}
                              className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold border-transparent focus:bg-white transition-all shadow-sm"
                            />
                         </div>
                         <textarea 
                            value={callData.summary}
                            onChange={(e) => setCallData({...callData, summary: e.target.value})}
                            placeholder="Brief summary of the conversation..."
                            className="w-full h-full min-h-[120px] bg-slate-50 rounded-2xl p-4 text-sm font-medium border-transparent focus:bg-white transition-all"
                         />
                      </div>
                    )}

                    {actionType === 'task' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <input 
                            type="text" 
                            placeholder="What needs to be done?" 
                            value={taskData.title}
                            onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                            className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold border-transparent focus:bg-white transition-all shadow-sm"
                            required
                         />
                         <input 
                            type="date" 
                            value={taskData.dueDate}
                            onChange={(e) => setTaskData({...taskData, dueDate: e.target.value})}
                            className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold border-transparent focus:bg-white transition-all shadow-sm"
                            required
                         />
                      </div>
                    )}

                    {actionType === 'email' && (
                      <div className="space-y-4">
                         <input 
                            type="text" 
                            placeholder="Subject" 
                            value={emailData.subject}
                            onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                            className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold border-transparent focus:bg-white transition-all shadow-sm"
                            required
                         />
                         <textarea 
                            value={emailData.body}
                            onChange={(e) => setEmailData({...emailData, body: e.target.value})}
                            placeholder="Write your email here..."
                            className="w-full h-48 bg-slate-50 rounded-2xl p-4 text-sm font-medium border-transparent focus:bg-white transition-all shadow-sm"
                            required
                         />
                      </div>
                    )}

                    {actionType === 'followup' && (
                      <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Schedule Date</label>
                               <input 
                                  type="date" 
                                  value={followUpDate}
                                  onChange={(e) => setFollowUpDate(e.target.value)}
                                  className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold border-transparent focus:bg-white transition-all shadow-sm"
                                  required
                               />
                            </div>
                            <div>
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Interaction Type</label>
                               <select 
                                  value={followUpType}
                                  onChange={(e) => setFollowUpType(e.target.value)}
                                  className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold border-transparent focus:bg-white transition-all shadow-sm appearance-none"
                               >
                                  <option>Call</option>
                                  <option>WhatsApp</option>
                                  <option>Email</option>
                                  <option>Meeting</option>
                                  <option>Demo</option>
                               </select>
                            </div>
                         </div>
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Quick Note (Optional)</label>
                            <textarea 
                               value={followUpNote}
                               onChange={(e) => setFollowUpNote(e.target.value)}
                               placeholder="e.g. Discussed pricing, send proposal next."
                               className="w-full h-24 bg-slate-50 rounded-2xl p-4 text-sm font-medium border-transparent focus:bg-white transition-all shadow-sm"
                            />
                         </div>
                      </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                       <button type="button" onClick={() => setActionType(null)} className="px-6 py-3 rounded-2xl text-slate-400 font-bold uppercase tracking-wider transition-all hover:bg-slate-50">Cancel</button>
                       <button 
                         type="submit" 
                         disabled={updating}
                         className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:scale-105 transition-all disabled:opacity-50">
                          {updating ? 'Saving...' : 'Save & Log'}
                        </button>
                    </div>
                  </form>
               </div>
             )}

             {/* SECTION 3: WORKSPACE CONTENT (TABS) */}
             <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center border-b border-slate-100 px-8">
                   <button 
                     onClick={() => setActiveTab('timeline')}
                     className={`px-6 py-5 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'timeline' ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                      Timeline
                   </button>
                   <button 
                     onClick={() => setActiveTab('notes')}
                     className={`px-6 py-5 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'notes' ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                      Notes
                   </button>
                   <button 
                     onClick={() => setActiveTab('tasks')}
                     className={`px-6 py-5 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'tasks' ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                      Pending Tasks
                   </button>
                   <button 
                     onClick={() => setActiveTab('chat')}
                     className={`px-6 py-5 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'chat' ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                      Chat
                   </button>
                   <button 
                     onClick={() => setActiveTab('docs')}
                     className={`px-6 py-5 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'docs' ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                      Attachments
                   </button>
                </div>

                <div className="p-8 min-h-[400px]">
                   {activeTab === 'timeline' && (
                     <div className="max-w-2xl">
                        {activities.length > 0 ? (
                           [...activities].sort((a,b) => new Date(b.date||b.createdAt) - new Date(a.date||a.createdAt)).map((act) => (
                             <ActivityTimelineItem key={act.id || act._id} activity={act} />
                           ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                             <FiActivity size={48} className="mb-4 opacity-20" />
                             <p className="text-xs font-black uppercase tracking-widest">No activities recorded yet</p>
                          </div>
                        )}
                     </div>
                   )}

                   {activeTab === 'notes' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {activities.filter(a => a.type === 'note').map(note => (
                           <div key={note.id || note._id} className="p-6 rounded-3xl bg-amber-50 border border-amber-100 hover:shadow-md transition-all">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-[9px] font-black text-amber-700">
                                  {note.user ? note.user[0] : 'S'}
                                </div>
                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-tight">{note.user || 'System'}</span>
                              </div>
                              <p className="text-sm font-medium text-slate-700 mb-3 leading-relaxed">{note.title || note.note}</p>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 {new Date(note.date || note.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}
                              </div>
                           </div>
                         ))}
                         {activities.filter(a => a.type === 'note').length === 0 && (
                           <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-300">
                             <FiFileText size={40} className="mb-3 opacity-20" />
                             <p className="text-xs font-black uppercase tracking-widest">No notes yet — add one above</p>
                           </div>
                         )}
                      </div>
                   )}

                   {activeTab === 'tasks' && (
                      <div className="space-y-4">
                         {tasks.map(task => {
                            const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';
                            return (
                               <div key={task._id} className={`p-5 rounded-3xl border transition-all flex items-center justify-between ${isOverdue ? 'bg-rose-50 border-rose-100 shadow-sm' : 'bg-white border-slate-100 hover:shadow-md'}`}>
                                  <div className="flex items-center gap-4">
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${task.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <FiCheckSquare />
                                     </div>
                                     <div>
                                        <h4 className={`text-sm font-black uppercase tracking-tight ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                           <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${task.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>{task.priority}</span>
                                           <span className={`text-[9px] font-bold uppercase tracking-widest ${isOverdue ? 'text-rose-600 underline' : 'text-slate-400'}`}>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                        </div>
                                     </div>
                                  </div>
                                   <button 
                                     onClick={() => task.status !== 'Completed' && markTaskDone(task._id)}
                                     disabled={task.status === 'Completed'}
                                     className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-500 cursor-default' : 'bg-slate-900 text-white hover:scale-105 hover:bg-indigo-600'}`}>
                                      {task.status === 'Completed' ? '✓ Done' : 'Mark Done'}
                                   </button>
                               </div>
                            );
                         })}
                         {tasks.length === 0 && (
                           <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                             <FiCheckSquare size={48} className="mb-4 opacity-20" />
                             <p className="text-xs font-black uppercase tracking-widest text-center">No pending tasks for this lead<br/><span className="text-[10px] font-medium opacity-50 lowercase tracking-normal italic mt-1 font-inter">Click "Schedule Task" above to add one</span></p>
                           </div>
                         )}
                      </div>
                   )}

                   {activeTab === 'chat' && (
                      <div className="flex flex-col" style={{height: '520px'}}>
                        {/* Participants Bar */}
                        {chatConversation && (
                          <div className="flex items-center gap-2 px-2 pb-4 mb-4 border-b border-slate-100 flex-wrap">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mr-1">Participants:</span>
                            {chatConversation.participants?.map(p => (
                              <span key={p._id} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded-full text-[10px] font-bold text-indigo-700">
                                <span className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center text-[8px] font-black">{p.name?.[0]}</span>
                                {p.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{minHeight:0}}>
                          {chatLoading && (
                            <div className="flex items-center justify-center h-full text-slate-300">
                              <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                            </div>
                          )}
                          {!chatLoading && chatMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                              <FiSend size={32} className="mb-3 opacity-20" />
                              <p className="text-[10px] font-black uppercase tracking-widest">No messages yet</p>
                              <p className="text-[9px] text-slate-400 mt-1">Start the internal discussion about this lead</p>
                            </div>
                          )}
                          {chatMessages.map(msg => {
                            const currentUserId = getCurrentUser()?.id;
                            const isMine = String(msg.senderId?._id || msg.senderId) === String(currentUserId);
                            return (
                              <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                {!isMine && (
                                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 mr-2 flex-shrink-0">
                                    {(msg.senderId?.name || 'U')[0]}
                                  </div>
                                )}
                                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMine ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'}`}>
                                  {!isMine && <p className="text-[9px] font-black mb-1 opacity-60 uppercase tracking-wide">{msg.senderId?.name}</p>}
                                  <p className="text-sm leading-relaxed">{msg.message}</p>
                                  <p className={`text-[9px] mt-1 ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'})}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!newChatMsg.trim() || !chatConversation) return;
                            setSendingMsg(true);
                            try {
                              const res = await API.post('/chat/messages', {
                                conversationId: chatConversation._id,
                                text: newChatMsg.trim()
                              });
                              setChatMessages(prev => [...prev, res.data.data]);
                              setNewChatMsg("");
                              setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                            } catch { toast.error("Failed to send message."); }
                            finally { setSendingMsg(false); }
                          }}
                          className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100"
                        >
                          <input
                            type="text"
                            value={newChatMsg}
                            onChange={e => setNewChatMsg(e.target.value)}
                            placeholder="Message your team about this lead..."
                            className="flex-1 bg-slate-50 rounded-2xl px-5 py-3 text-sm font-medium border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                          />
                          <button
                            type="submit"
                            disabled={sendingMsg || !newChatMsg.trim()}
                            className="w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-40 flex-shrink-0"
                          >
                            <FiSend size={16} />
                          </button>
                        </form>
                      </div>
                   )}

                   {activeTab === 'docs' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                         <div className="border-2 border-dashed border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-300 hover:border-indigo-100 hover:text-indigo-600 cursor-pointer transition-all">
                            <FiPlus size={24} className="mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Upload File</span>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

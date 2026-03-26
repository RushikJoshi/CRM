import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FiArrowLeft, FiUser, FiMail, FiPhone, FiInbox,
    FiMessageSquare, FiActivity, FiGlobe, FiCheckCircle,
    FiClock, FiSend, FiTag, FiMoreHorizontal, FiDownload, FiFile, FiTrash2, FiUserCheck, FiZap
} from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

function formatDate(d) {
    return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

function formatDateTime(d) {
    return d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
}

const TIMELINE_TYPE_LABELS = {
    note: "Note",
    call: "Call",
    meeting: "Meeting",
    task: "Task",
    email: "Email",
    message: "Message",
    whatsapp: "WhatsApp",
    inquiry: "Created",
    inquiry_status_changed: "Status Updated",
    inquiry_converted: "Converted to Lead",
    system: "System",
};

function ActivityItem({ item, isLast }) {
    const label = TIMELINE_TYPE_LABELS[item.type] || item.type || "Activity";
    const date = item.date ? new Date(item.date) : (item.createdAt ? new Date(item.createdAt) : null);
    const timeStr = date && !isNaN(date.getTime())
        ? date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
        : "—";
    
    const name = item.user?.name || item.user || "System";
    const initials = (typeof name === 'string' ? name : "S")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("") || "?";

    return (
        <div className="relative flex -ml-10">
            <div className="w-8 shrink-0 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-700 shadow-sm z-[1]">
                    {initials}
                </div>
                {!isLast && <div className="w-0.5 flex-1 min-h-[12px] bg-slate-100" />}
            </div>
            <div className="flex-1 min-w-0 pl-4 pb-8">
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-slate-800">{name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{timeStr}</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
                <div className="mt-2 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{item.note ?? item.title ?? "—"}</p>
                    {item.attachments?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {item.attachments.map((file, idx) => (
                                <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-700 hover:border-blue-200 hover:bg-blue-50 transition-all font-bold">
                                    <FiFile size={10} /> {file.name} <FiDownload size={10} />
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function InquiryDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const socket = useSocket();
    const currentUser = getCurrentUser();

    const [inquiry, setInquiry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [activityLoading, setActivityLoading] = useState(true);
    const [tab, setTab] = useState("activity");
    const [noteText, setNoteText] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchInquiry = useCallback(async () => {
        try {
            const res = await API.get(`/inquiries/${id}`);
            setInquiry(res.data?.data || res.data);
        } catch (err) {
            toast.error("Failed to load inquiry.");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    }, [id, navigate, toast]);

    const fetchActivities = useCallback(async () => {
        setActivityLoading(true);
        try {
            const res = await API.get(`/activities/timeline?inquiryId=${id}`);
            setActivities(res.data?.data || []);
        } catch (err) {
            console.error("Failed to load activities", err);
        } finally {
            setActivityLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchInquiry();
        fetchActivities();
    }, [fetchInquiry, fetchActivities]);

    useEffect(() => {
        if (!socket || !id) return;
        const handleUpdate = (data) => {
            if (data.inquiryId === id) {
                fetchInquiry();
                fetchActivities();
            }
        };
        socket.on("inquiry_updated", handleUpdate);
        return () => socket.off("inquiry_updated", handleUpdate);
    }, [socket, id, fetchInquiry, fetchActivities]);

    const handleUpdateStatus = async (newStatus) => {
        setUpdatingStatus(true);
        try {
            await API.patch(`/inquiries/${id}`, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            fetchInquiry();
            fetchActivities();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update status.");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleLogNote = async (e) => {
        e.preventDefault();
        if (!noteText.trim()) return;
        setSavingNote(true);
        try {
            await API.post("/activities", {
                inquiryId: id,
                type: "note",
                note: noteText
            });
            setNoteText("");
            toast.success("Note logged successfully.");
            fetchActivities();
        } catch (err) {
            toast.error("Failed to log note.");
        } finally {
            setSavingNote(false);
        }
    };

    const handleConvert = () => {
        const base = currentUser?.role === 'super_admin' ? '/superadmin' : (currentUser?.role === 'sales' ? '/sales' : (currentUser?.role === 'branch_manager' ? '/branch' : '/company'));
        navigate(`${base}/inquiries/${id}/convert`);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin shadow-lg shadow-blue-500/10" />
                    <p className="text-[12px] font-black text-slate-300 uppercase tracking-widest">Hydrating Inquiry...</p>
                </div>
            </div>
        );
    }

    const STATUS_COLORS = {
        new: "bg-blue-50 text-blue-600 border-blue-100",
        contacted: "bg-amber-50 text-amber-600 border-amber-100",
        qualified: "bg-emerald-50 text-emerald-600 border-emerald-100",
        converted: "bg-indigo-50 text-indigo-600 border-indigo-100",
        rejected: "bg-rose-50 text-rose-600 border-rose-100"
    };

    return (
        <div className="bg-[#f8fafc] min-h-full animate-fade-in pb-10">
            {/* Header Sticky */}
            <div className="sticky top-0 z-40 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl transition-all border border-slate-100 group">
                        <FiArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 font-black text-xl">
                            {inquiry.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-[22px] font-bold text-slate-800 poppins tracking-tight leading-none">{inquiry.name}</h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[inquiry.status] || "bg-slate-50 text-slate-500 border-slate-100"}`}>
                                    {inquiry.status}
                                </span>
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1.5">
                                    <FiGlobe size={12} /> {inquiry.source || "Web"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {inquiry.status !== "converted" && (
                        <>
                            <select 
                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                value={inquiry.status}
                                disabled={updatingStatus}
                                className="h-10 pl-4 pr-10 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="new">Mark New</option>
                                <option value="contacted">Mark Contacted</option>
                                <option value="qualified">Mark Qualified</option>
                                <option value="rejected">Mark Rejected</option>
                            </select>
                            <button 
                                onClick={handleConvert}
                                className="btn-saas-primary px-6 h-10 gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <FiZap size={16} /> Convert to Lead
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-8">
                        <div>
                            <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-4">Core Contact Details</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <FiMail size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email Address</p>
                                        <p className="text-[14px] font-bold text-slate-800 truncate">{inquiry.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <FiPhone size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Direct Phone</p>
                                        <p className="text-[14px] font-bold text-slate-800">{inquiry.phone || "-"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-400">
                                        <FiInbox size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Selected Course</p>
                                        <p className="text-[14px] font-bold text-slate-800">{inquiry.courseSelected || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-400">
                                        <FiZap size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Test Score</p>
                                        <p className="text-[14px] font-bold text-slate-800">{inquiry.testScore ?? 0} %</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100" />

                        <div>
                            <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-4">System Data</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <FiClock size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Captured At</p>
                                        <p className="text-[14px] font-bold text-slate-800">{formatDateTime(inquiry.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <FiUserCheck size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Assigned To</p>
                                        <p className="text-[14px] font-bold text-slate-800">{inquiry.assignedTo?.name || "System Distribution"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Message Box */}
                    <div className="bg-blue-600 rounded-[2rem] border border-blue-500 shadow-xl shadow-blue-600/10 p-8 text-white">
                        <FiMessageSquare size={24} className="opacity-40 mb-4" />
                        <h3 className="text-[11px] font-black text-blue-200 uppercase tracking-widest mb-2">Primary Message</h3>
                        <p className="text-[15px] font-medium leading-relaxed italic">
                           "{inquiry.message || "No specific message provided with this inquiry."}"
                        </p>
                    </div>
                </div>

                {/* Right: Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                        <div className="px-8 pt-8 flex items-center gap-10 border-b border-slate-50">
                            <button 
                                onClick={() => setTab("activity")}
                                className={`pb-6 text-[13px] font-black uppercase tracking-widest transition-all relative ${tab === 'activity' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Activity History
                                {tab === 'activity' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full shadow-lg shadow-blue-500/20 animate-fade-in" />}
                            </button>
                            <button 
                                onClick={() => setTab("notes")}
                                className={`pb-6 text-[13px] font-black uppercase tracking-widest transition-all relative ${tab === 'notes' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Private Notes
                                {tab === 'notes' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full shadow-lg shadow-blue-500/20 animate-fade-in" />}
                            </button>
                        </div>

                        <div className="flex-1 p-8">
                            {tab === "activity" && (
                                <div className="space-y-8 pl-10">
                                    <div className="bg-slate-50 rounded-[2rem] p-6 mb-10 border border-slate-100">
                                        <form onSubmit={handleLogNote}>
                                            <div className="relative">
                                                <FiActivity size={18} className="absolute left-6 top-6 text-slate-300" />
                                                <textarea 
                                                    value={noteText}
                                                    onChange={e => setNoteText(e.target.value)}
                                                    placeholder="Log a call, update, or internal note..."
                                                    className="w-full pl-16 pr-6 pt-6 pb-20 bg-white border border-slate-100 rounded-[1.5rem] text-[14px] font-medium text-slate-700 outline-none focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none shadow-inner"
                                                    rows={3}
                                                />
                                                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                                    <button 
                                                        type="submit"
                                                        disabled={savingNote || !noteText.trim()}
                                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                                    >
                                                        {savingNote ? <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <><FiSend size={14} /> Log Action</>}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>

                                    {activityLoading ? (
                                        <div className="flex flex-col items-center py-20 gap-4">
                                            <div className="w-8 h-8 border-2 border-slate-100 border-t-blue-500 rounded-full animate-spin" />
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Compiling History...</p>
                                        </div>
                                    ) : activities.length > 0 ? (
                                        activities.map((act, i) => (
                                            <ActivityItem key={act._id} item={act} isLast={i === activities.length - 1} />
                                        ))
                                    ) : (
                                        <div className="py-20 text-center">
                                            <FiActivity className="mx-auto text-slate-100 mb-4" size={48} />
                                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">No activities logged yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {tab === "notes" && (
                                <div className="flex flex-col items-center justify-center py-40 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-100">
                                    <FiTag className="text-slate-200 mb-4" size={40} />
                                    <p className="text-[14px] font-bold text-slate-400">Private notes feature coming soon.</p>
                                    <p className="text-[11px] text-slate-300 mt-1 uppercase font-black tracking-widest">Use Activity history to log notes for now.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

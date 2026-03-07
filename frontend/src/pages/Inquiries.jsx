import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiInbox, FiRefreshCw, FiArrowRight, FiTrash2,
    FiSearch, FiClock, FiMail, FiPhone, FiGlobe, FiFilter,
    FiPlus, FiEyeOff, FiRotateCcw
} from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

const STATUS_COLORS = {
    Open: "bg-orange-50 text-orange-600 border-orange-100",
    Converted: "bg-green-50 text-green-600 border-green-100",
    Ignored: "bg-gray-50 text-gray-400 border-gray-100"
};

const InquiriesPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [websiteFilter, setWebsiteFilter] = useState("all");

    const currentUser = getCurrentUser();
    const role = currentUser?.role;

    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        converted: 0,
        ignored: 0,
        websites: []
    });

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const res = await API.get("/inquiries");
            const data = res.data?.data || res.data || [];
            setInquiries(data);

            const websites = [...new Set(data.map(i => i.website).filter(Boolean))];

            setStats({
                total: data.length,
                open: data.filter(i => i.status === "Open").length,
                converted: data.filter(i => i.status === "Converted").length,
                ignored: data.filter(i => i.status === "Ignored").length,
                websites
            });
        } catch (err) {
            console.error("Failed to fetch inquiries:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInquiries(); }, []);

    const updateStatus = async (id, status) => {
        try {
            await API.put(`/inquiries/${id}/status`, { status });
            toast.success(`Status updated to ${status}`);
            fetchInquiries();
        } catch (err) {
            toast.error("Status update failed.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently archive this inquiry from the database?")) return;
        try {
            await API.delete(`/inquiries/${id}`);
            toast.success("Inquiry archived.");
            fetchInquiries();
        } catch (err) {
            toast.error("Deletion failed.");
        }
    };

    const filtered = inquiries.filter(item => {
        const q = search.toLowerCase();
        const matchesSearch =
            item.name?.toLowerCase().includes(q) ||
            item.email?.toLowerCase().includes(q) ||
            item.phone?.toLowerCase().includes(q) ||
            item.message?.toLowerCase().includes(q);

        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        const matchesWebsite = websiteFilter === "all" || item.website === websiteFilter;

        return matchesSearch && matchesStatus && matchesWebsite;
    });

    const getFormPath = (id, action = 'create') => {
        const base = (role === 'sales' ? '/sales' : (role === 'branch_manager' ? '/branch' : '/company'));
        return action === 'convert' ? `${base}/inquiries/${id}/convert` : `${base}/inquiries/create`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:shadow-green-500/5">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Inbound Inquiries</h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
                        Cross-channel acquisition logs for {stats.websites.length || "0"} origins
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => navigate(getFormPath())}
                        className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        <FiPlus size={20} />
                        Add Inquiry
                    </button>
                    <button
                        onClick={fetchInquiries}
                        className="p-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-green-100 hover:text-green-600 transition-all border border-transparent hover:border-green-100 group"
                    >
                        <FiRefreshCw size={20} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: "Total Volume", val: stats.total, color: "text-gray-900", icon: <FiInbox /> },
                    { label: "Open Signals", val: stats.open, color: "text-orange-500", icon: <FiClock /> },
                    { label: "Converted Assets", val: stats.converted, color: "text-green-600", icon: <FiArrowRight /> },
                    { label: "Ignored Noise", val: stats.ignored, color: "text-gray-400", icon: <FiEyeOff /> }
                ].map(s => (
                    <div key={s.label} className="bg-white p-6 rounded-[1.8rem] border border-gray-100 shadow-sm group hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</span>
                            <span className={`text-xl ${s.color} opacity-20 group-hover:opacity-100 transition-opacity`}>{s.icon}</span>
                        </div>
                        <h2 className={`text-3xl font-black mt-2 tracking-tighter ${s.color}`}>{s.val}</h2>
                    </div>
                ))}
            </div>

            {/* Inquiries List & Filters */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                {/* Global Search & Filters */}
                <div className="p-6 border-b border-gray-50 bg-gray-50/20 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[300px] relative group">
                        <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="De-hash by name, contact, or content..."
                            className="w-full pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-[1.2rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 placeholder-gray-400"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table Header */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-gray-50/50 border-b border-gray-50">
                    <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Signal / Prospect</div>
                    <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Origin / Platform</div>
                    <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Requirement Packet</div>
                    <div className="col-span-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</div>
                    <div className="col-span-1 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Date</div>
                    <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right px-4">Tactical</div>
                </div>

                {/* Rows */}
                {loading ? (
                    <div className="py-32 flex flex-col items-center gap-4 bg-white/50 animate-pulse">
                        <div className="w-14 h-14 border-[6px] border-green-50 border-t-green-500 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mapping Intelligence logs...</p>
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {filtered.map((item, i) => (
                            <div key={item._id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center px-8 py-6 hover:bg-green-50/30 transition-all duration-300 animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 30}ms` }}>
                                {/* Identity */}
                                <div className="lg:col-span-3 space-y-1.5">
                                    <h4 className="font-black text-gray-900 group-hover:text-green-600 transition-colors">{item.name}</h4>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-gray-400 text-[11px] font-bold">
                                            <FiMail className="shrink-0" /> {item.email}
                                        </div>
                                        {item.phone && (
                                            <div className="flex items-center gap-2 text-gray-400 text-[11px] font-bold">
                                                <FiPhone className="shrink-0" /> {item.phone}
                                            </div>
                                        )}
                                        {item.companyName && (
                                            <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">{item.companyName}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Origin */}
                                <div className="lg:col-span-2 space-y-2">
                                    <div className="flex items-center gap-2 text-blue-500 text-[11px] font-black">
                                        <FiGlobe className="shrink-0" />
                                        <span className="truncate max-w-[140px]">{item.website || "No Direct URL"}</span>
                                    </div>
                                    <span className="inline-block px-3 py-1 bg-gray-100/80 text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-gray-200">
                                        {item.source || "Organic Signal"}
                                    </span>
                                </div>

                                {/* Message */}
                                <div className="lg:col-span-3">
                                    <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                                        <p className="text-gray-500 text-xs font-bold italic line-clamp-2 leading-relaxed">
                                            "{item.message || "No contextual packet attached."}"
                                        </p>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="lg:col-span-1">
                                    <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter border ${STATUS_COLORS[item.status]}`}>
                                        {item.status}
                                    </span>
                                </div>

                                {/* Date */}
                                <div className="lg:col-span-1 text-center">
                                    <div className="flex flex-col text-gray-300 font-black">
                                        <span className="text-xs">{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                                        <span className="text-[9px] opacity-70">{new Date(item.createdAt).toLocaleDateString("en-IN", { year: "numeric" })}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="lg:col-span-2 px-4 space-y-2">
                                    <div className="flex items-center gap-2 justify-end">
                                        {item.status === "Open" && (
                                            <>
                                                <button
                                                    onClick={() => navigate(getFormPath(item._id, 'convert'))}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white font-black rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                                                >
                                                    <FiArrowRight /> Lead
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(item._id, "Ignored")}
                                                    title="Mark as Noise"
                                                    className="p-2.5 bg-gray-50 text-gray-400 border border-gray-200 rounded-xl hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200 transition-all"
                                                >
                                                    <FiEyeOff size={16} />
                                                </button>
                                            </>
                                        )}
                                        {item.status === "Ignored" && (
                                            <button
                                                onClick={() => updateStatus(item._id, "Open")}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-600 font-black rounded-xl border border-orange-100 hover:bg-orange-100 transition-all text-[10px] uppercase tracking-widest"
                                            >
                                                <FiRotateCcw /> Reopen
                                            </button>
                                        )}
                                        {item.status === "Converted" && (
                                            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 font-black rounded-xl border border-green-100 text-[10px] uppercase tracking-widest opacity-60">
                                                Finalized
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-40 flex flex-col items-center gap-4 text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center justify-center text-gray-200 relative">
                            <FiInbox size={48} />
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full border border-gray-100 flex items-center justify-center text-gray-300">
                                <FiFilter size={14} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Silence Detected</p>
                            <p className="text-gray-300 text-xs font-bold mt-1">No inquiries match your current visibility parameters.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InquiriesPage;

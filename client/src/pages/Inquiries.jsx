import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiInbox, FiRefreshCw, FiArrowRight,
    FiSearch, FiClock, FiMail, FiPhone, FiGlobe, FiFilter,
    FiPlus, FiEyeOff, FiRotateCcw, FiEye
} from "react-icons/fi";
import API from "../services/api";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";
import InquiryDetailsModal from "../components/InquiryDetailsModal";

const STATUS_COLORS = {
    Open: "bg-orange-50 text-orange-600 border-orange-100",
    Converted: "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20",
    Ignored: "bg-[#F4F7FB] text-[#718096] border-[#E5EAF2]"
};

const InquiriesPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [websiteFilter, setWebsiteFilter] = useState("all");
    const [locationFilter, setLocationFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;
    const [selectedInquiry, setSelectedInquiry] = useState(null);

    const currentUser = getCurrentUser();
    const role = currentUser?.role;

    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        converted: 0,
        ignored: 0,
        external: 0,
        websites: [],
        locations: []
    });

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
            if (search) params.set("search", search);
            if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
            const res = await API.get(`/inquiries?${params.toString()}`);
            const data = res.data?.data || res.data || [];
            setInquiries(data);
            setTotalPages(res.data?.totalPages ?? 1);
            setTotal(res.data?.total ?? 0);

            const websites = [...new Set(data.map(i => i.website).filter(Boolean))];
            const locations = [...new Set(data.map(i => i.location).filter(Boolean))];
            const open = data.filter(i => i.status === "Open").length;
            const converted = data.filter(i => i.status === "Converted").length;
            const ignored = data.filter(i => i.status === "Ignored").length;
            const external = data.filter(i => !!i.website || String(i.source || "").toLowerCase().includes("external")).length;
            setStats(prev => ({
                ...prev,
                total: res.data?.total ?? data.length,
                open,
                converted,
                ignored,
                external,
                websites,
                locations
            }));
        } catch (err) {
            console.error("Failed to fetch inquiries:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPage(1); }, [search, statusFilter]);
    useEffect(() => { fetchInquiries(); }, [page, search, statusFilter]);

    const updateStatus = async (id, status) => {
        try {
            await API.put(`/inquiries/${id}/status`, { status });
            toast.success(`Status updated to ${status}`);
            fetchInquiries();
        } catch (err) {
            toast.error("Status update failed.");
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
        const matchesLocation = locationFilter === "all" || item.location === locationFilter;

        return matchesSearch && matchesStatus && matchesWebsite && matchesLocation;
    });

    const getFormPath = (id, action = 'create') => {
        const base = (role === 'sales' ? '/sales' : (role === 'branch_manager' ? '/branch' : '/company'));
        return action === 'convert' ? `${base}/inquiries/${id}/convert` : `${base}/inquiries/create`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Simple & Clean Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Inquiry List</h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                        Track and manage your incoming inquiries
                    </p>
                </div>
                <div className="flex items-center gap-4 relative z-10 w-full lg:w-auto">
                    <button
                        onClick={() => navigate(getFormPath())}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-3.5 bg-sky-500 text-white font-black rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest min-w-[180px]"
                    >
                        <FiPlus size={20} strokeWidth={3} />
                        Add New Inquiry
                    </button>
                    <button
                        onClick={fetchInquiries}
                        className="p-3.5 bg-gray-50 text-gray-400 border border-transparent rounded-2xl hover:bg-white hover:text-sky-500 hover:border-sky-200 transition-all shadow-sm"
                    >
                        <FiRefreshCw size={20} className={loading ? "animate-spin text-sky-500" : ""} />
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Inquiries", val: stats.total, color: "text-gray-900", icon: <FiInbox />, bg: "bg-gray-50 text-gray-400" },
                    { label: "External Inquiries", val: stats.external, color: "text-sky-600", icon: <FiGlobe />, bg: "bg-sky-50 text-sky-500" },
                    { label: "Converted", val: stats.converted, color: "text-emerald-500", icon: <FiArrowRight />, bg: "bg-emerald-50 text-emerald-500" },
                    { label: "Archived", val: stats.ignored, color: "text-gray-400", icon: <FiEyeOff />, bg: "bg-gray-50 text-gray-400" }
                ].map(s => (
                    <div key={s.label} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group hover:border-sky-200 transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</span>
                            <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center text-xl transition-all group-hover:scale-110 shadow-sm border border-transparent`}>
                                {s.icon}
                            </div>
                        </div>
                        <h2 className={`text-4xl font-black tracking-tight ${s.color}`}>{s.val}</h2>
                    </div>
                ))}
            </div>


            {/* Search & Filter Bar */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px] relative group">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search inquiries..."
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 placeholder-gray-300 shadow-sm text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <div className="relative group flex-1 min-w-[160px] lg:w-44">
                        <FiFilter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors z-10" />
                        <select
                            className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-xs uppercase tracking-widest appearance-none cursor-pointer shadow-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="Open">Open</option>
                            <option value="Converted">Converted</option>
                            <option value="Ignored">Ignored</option>
                        </select>
                    </div>

                    <div className="relative group flex-1 min-w-[160px] lg:w-44">
                        <FiGlobe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors z-10" />
                        <select
                            className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-xs uppercase tracking-widest appearance-none cursor-pointer shadow-sm"
                            value={websiteFilter}
                            onChange={(e) => setWebsiteFilter(e.target.value)}
                        >
                            <option value="all">All Channels</option>
                            {stats.websites.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>

                    <div className="relative group flex-1 min-w-[160px] lg:w-44">
                        <FiGlobe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors z-10" />
                        <select
                            className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-xs uppercase tracking-widest appearance-none cursor-pointer shadow-sm"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                        >
                            <option value="all">All Locations</option>
                            {stats.locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            {/* Inquiries List */}
            <div className="canvas-card overflow-hidden">
                {/* Table Header */}
                <div className="hidden lg:grid grid-cols-12 gap-6 px-10 py-6 bg-gray-50 border-b border-gray-100 shadow-sm relative z-10">
                    <div className="col-span-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Customer Name</div>
                    <div className="col-span-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">Source</div>
                    <div className="col-span-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">Est. Value</div>
                    <div className="col-span-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">Message</div>
                    <div className="col-span-1 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</div>
                    <div className="col-span-1 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Date</div>
                    <div className="col-span-1 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</div>
                </div>

                {/* Rows */}
                {loading ? (
                    <div className="py-40 flex flex-col items-center gap-6 bg-white animate-pulse">
                        <div className="w-16 h-16 border-[6px] border-[#F4F7FB] border-t-blue-500 rounded-full animate-spin shadow-lg"></div>
                        <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.3em]">Loading Inquiries...</p>
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="divide-y divide-[#F0F2F5]">
                        {filtered.map((item, i) => (
                            <div key={item._id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center px-10 py-8 hover:bg-slate-50/80 transition-all duration-300 group animate-in slide-in-from-bottom-3 duration-700" style={{ animationDelay: `${i * 30}ms` }}>
                                {/* Identity */}
                                <div className="lg:col-span-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5EAF2] flex items-center justify-center font-black text-[#1A202C] text-xl shadow-sm group-hover:border-blue-200 group-hover:shadow-lg transition-all group-hover:rotate-3">
                                            {item.name?.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-[#1A202C] group-hover:text-blue-600 transition-colors text-[15px] truncate">{item.name}</h4>
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                <div className="flex items-center gap-2 text-[#718096] text-[11px] font-black truncate">
                                                    <FiMail className="shrink-0 text-[#CBD5E0]" /> {item.email}
                                                </div>
                                                {item.phone && (
                                                    <div className="flex items-center gap-2 text-[#718096] text-[11px] font-black">
                                                        <FiPhone className="shrink-0 text-[#CBD5E0]" /> {item.phone}
                                                    </div>
                                                )}
                                                {item.companyName && (
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{item.companyName}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Origin */}
                                <div className="lg:col-span-2 space-y-3">
                                    <div className="flex items-center gap-2 text-indigo-500 text-[11px] font-black">
                                        <FiGlobe className="shrink-0" />
                                        <span className="truncate max-w-[140px] uppercase tracking-wider">{item.website || "DIRECT"}</span>
                                    </div>
                                    <span className="inline-block px-4 py-1.5 bg-[#F4F7FB] text-[#718096] text-[10px] font-black uppercase tracking-widest rounded-xl border border-[#E5EAF2] shadow-sm">
                                        {item.source || "ORGANIC"}
                                    </span>
                                    {item.location && (
                                        <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 shadow-sm">
                                            {item.location}
                                        </span>
                                    )}
                                </div>

                                {/* Value */}
                                <div className="lg:col-span-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-1.5 leading-none">Estimate</span>
                                        <div className="flex items-center text-blue-600 font-extrabold text-lg tracking-tight">
                                            <span className="text-[12px] mr-1.5 opacity-60 font-black text-[#A0AEC0]">₹</span>
                                            {(item.value || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="lg:col-span-2">
                                    <div className="p-4 bg-[#F4F7FB]/50 border border-[#E5EAF2] rounded-[18px] shadow-inner group-hover:bg-white transition-colors duration-500 h-[64px]">
                                        <p className="text-[#718096] text-[12px] font-bold italic line-clamp-2 leading-relaxed">
                                            "{item.message || "No message data provided."}"
                                        </p>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="lg:col-span-1">
                                    <span className={`inline-flex px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm ${STATUS_COLORS[item.status]?.replace('blue', 'sky').replace('orange', 'sky') || 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                        {item.status}
                                    </span>
                                </div>

                                {/* Date */}
                                <div className="lg:col-span-1 text-center">
                                    <div className="flex flex-col text-[#CBD5E0] font-black group-hover:text-blue-200 transition-colors">
                                        <span className="text-sm font-black text-[#1A202C]">{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                                        <span className="text-[10px] uppercase tracking-[.2em] mt-1">{new Date(item.createdAt).toLocaleDateString("en-IN", { year: "numeric" })}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="lg:col-span-1 text-right">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={() => item.status === "Open" && navigate(getFormPath(item._id, 'convert'))}
                                            disabled={item.status !== "Open"}
                                            title={item.status === "Open" ? "Convert inquiry to lead & assign member" : "Already converted"}
                                            className={`px-4 h-11 rounded-[999px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all shadow-lg ${
                                                item.status === "Open"
                                                    ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.03] active:scale-95 shadow-blue-500/20"
                                                    : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-transparent"
                                            }`}
                                        >
                                            <FiArrowRight size={16} strokeWidth={3} />
                                            <span>Convert & Assign</span>
                                        </button>
                                        {item.status === "Open" && (
                                            <button
                                                onClick={() => updateStatus(item._id, "Ignored")}
                                                title="Archive/Ignore"
                                                className="w-11 h-11 bg-white border border-[#E5EAF2] text-[#718096] rounded-[14px] flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                                            >
                                                <FiEyeOff size={18} />
                                            </button>
                                        )}
                                        {item.status === "Ignored" && (
                                            <button
                                                onClick={() => updateStatus(item._id, "Open")}
                                                title="Restore"
                                                className="w-11 h-11 bg-orange-50 text-orange-600 rounded-[14px] border border-orange-100 flex items-center justify-center hover:bg-orange-100 hover:scale-110 active:scale-95 transition-all shadow-sm shadow-orange-500/10"
                                            >
                                                <FiRotateCcw size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSelectedInquiry(item)}
                                            className="w-11 h-11 bg-white border border-gray-100 text-gray-300 rounded-[14px] flex items-center justify-center hover:text-sky-500 hover:bg-sky-50 transition-all shadow-sm"
                                            title="View Details"
                                        >
                                            <FiEye size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-48 flex flex-col items-center gap-8 text-center bg-slate-50/20">
                        <div className="w-28 h-28 bg-white rounded-[40px] border border-[#E5EAF2] shadow-xl flex items-center justify-center text-[#CBD5E0] relative group hover:rotate-6 transition-all duration-700">
                            <FiInbox size={56} />
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg animate-bounce">
                                <FiPlus size={16} strokeWidth={4} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <p className="text-[13px] font-black text-[#1A202C] uppercase tracking-[0.3em]">Inquiry List</p>
                            <p className="text-[#A0AEC0] text-sm font-bold max-w-xs mx-auto leading-relaxed">No inquiries found for your current filters.</p>
                        </div>
                    </div>
                )}
            </div>
            {totalPages > 1 && (
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
            )}

            <InquiryDetailsModal
                isOpen={Boolean(selectedInquiry)}
                onClose={() => setSelectedInquiry(null)}
                inquiry={selectedInquiry}
            />
        </div >
    );
};

export default InquiriesPage;

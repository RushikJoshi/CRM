import React, { useState, useEffect } from "react";
import {
    FiInbox, FiRefreshCw, FiArrowRight, FiTrash2,
    FiSearch, FiClock, FiMail, FiPhone, FiGlobe, FiFilter
} from "react-icons/fi";
import API from "../services/api";

const STATUS_COLORS = {
    Open: "bg-orange-50 text-orange-600 border-orange-100",
    Converted: "bg-green-50 text-green-600 border-green-100",
    Ignored: "bg-gray-50 text-gray-400 border-gray-100"
};

const InquiriesPage = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterWebsite, setFilterWebsite] = useState("all");
    const [converting, setConverting] = useState(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, converted: 0, websites: [] });

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const res = await API.get("/inquiries");
            const data = res.data.data || [];
            setInquiries(data);

            // Derive unique website list for filter
            const websites = [...new Set(data.map(i => i.website).filter(Boolean))];

            setStats({
                total: data.length,
                pending: data.filter(i => i.status === "Open").length,
                converted: data.filter(i => i.status === "Converted").length,
                websites
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInquiries(); }, []);

    const handleConvert = async (id) => {
        if (!window.confirm("Convert this inquiry into a Lead record?")) return;
        setConverting(id);
        try {
            await API.post(`/inquiries/${id}/convert`);
            fetchInquiries();
        } catch (err) {
            alert("Conversion failed: " + (err.response?.data?.message || err.message));
        } finally {
            setConverting(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this inquiry from the active queue?")) return;
        try {
            await API.delete(`/inquiries/${id}`);
            fetchInquiries();
        } catch (err) { console.error(err); }
    };

    // Client-side filtering
    const filtered = inquiries.filter(item => {
        const q = search.toLowerCase();
        const matchSearch =
            item.name?.toLowerCase().includes(q) ||
            item.email?.toLowerCase().includes(q) ||
            item.phone?.toLowerCase().includes(q) ||
            item.website?.toLowerCase().includes(q) ||
            item.message?.toLowerCase().includes(q);
        const matchWebsite = filterWebsite === "all" || item.website === filterWebsite;
        return matchSearch && matchWebsite;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Inbound Inquiries</h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
                        All website form submissions across {stats.websites.length || "all"} sources.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Website Filter */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                        <FiGlobe className="text-gray-400" size={15} />
                        <select
                            value={filterWebsite}
                            onChange={e => setFilterWebsite(e.target.value)}
                            className="bg-transparent text-sm font-bold text-gray-700 outline-none"
                        >
                            <option value="all">All Websites</option>
                            {stats.websites.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative group">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search inquiries..."
                            className="pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={fetchInquiries}
                        className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all border border-green-100"
                    >
                        <FiRefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Inquiries", val: stats.total, color: "text-gray-900" },
                    { label: "Pending", val: stats.pending, color: "text-orange-500" },
                    { label: "Converted", val: stats.converted, color: "text-green-600" },
                    { label: "Active Websites", val: stats.websites.length, color: "text-blue-500" }
                ].map(s => (
                    <div key={s.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                        <h2 className={`text-3xl font-black mt-1 ${s.color}`}>{s.val}</h2>
                    </div>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="h-64 bg-white rounded-3xl border border-gray-100 flex items-center justify-center animate-pulse">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-400 animate-bounce">
                            <FiInbox size={28} />
                        </div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Loading inquiries...</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                        {["Name / Contact", "Website / Source", "Message", "Status", "Date", "Actions"].map(h => (
                            <div key={h} className={`text-[9px] font-black text-gray-400 uppercase tracking-widest ${h === "Message" ? "col-span-3" : h === "Name / Contact" ? "col-span-3" : h === "Actions" ? "col-span-2 text-right" : "col-span-1"}`}>
                                {h}
                            </div>
                        ))}
                    </div>

                    {filtered.length > 0 ? filtered.map((item, i) => (
                        <div key={item._id} className={`grid grid-cols-1 lg:grid-cols-12 gap-4 items-center px-6 py-5 border-b border-gray-50 hover:bg-green-50/30 transition-all group ${i % 2 === 0 ? "" : "bg-gray-50/20"}`}>
                            {/* Name / Contact */}
                            <div className="lg:col-span-3 space-y-1">
                                <p className="font-black text-gray-900 text-sm">{item.name}</p>
                                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                                    <FiMail size={11} /><span>{item.email}</span>
                                </div>
                                {item.phone && (
                                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                                        <FiPhone size={11} /><span>{item.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Website / Source */}
                            <div className="lg:col-span-2 space-y-1">
                                {item.website && (
                                    <div className="flex items-center gap-1.5 text-blue-500 text-xs font-black">
                                        <FiGlobe size={12} />
                                        <span className="truncate max-w-[130px]">{item.website}</span>
                                    </div>
                                )}
                                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-md">
                                    {item.source || "Unknown"}
                                </span>
                            </div>

                            {/* Message */}
                            <div className="lg:col-span-3">
                                <p className="text-gray-400 text-xs font-medium italic truncate max-w-xs">
                                    {item.message || "No message provided."}
                                </p>
                            </div>

                            {/* Status */}
                            <div className="lg:col-span-1">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${STATUS_COLORS[item.status] || "bg-gray-50 text-gray-400"}`}>
                                    {item.status}
                                </span>
                            </div>

                            {/* Date */}
                            <div className="lg:col-span-1">
                                <div className="flex items-center gap-1.5 text-gray-300 text-[10px] font-black">
                                    <FiClock size={11} />
                                    {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="lg:col-span-2 flex items-center gap-2 justify-end">
                                {item.status !== "Converted" && (
                                    <button
                                        onClick={() => handleConvert(item._id)}
                                        disabled={converting === item._id}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-black rounded-lg shadow-md shadow-green-500/20 hover:bg-green-600 transition-all text-xs uppercase tracking-widest disabled:opacity-60"
                                    >
                                        {converting === item._id ? (
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <FiArrowRight size={14} />
                                        )}
                                        Lead
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(item._id)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="py-24 flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 border border-gray-100">
                                <FiInbox size={36} />
                            </div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                {search || filterWebsite !== "all" ? "No results match your filters." : "No inquiries yet. Configure your WordPress forms to post here."}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InquiriesPage;

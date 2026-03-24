import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiInbox, FiSearch, FiMail, FiGlobe, FiFilter,
    FiPlus, FiChevronRight, FiCheckCircle
} from "react-icons/fi";
import API from "../services/api";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

const InquiriesPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [locationFilter, setLocationFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    const currentUser = getCurrentUser();
    const role = currentUser?.role;

    const [filterOptions, setFilterOptions] = useState({ locations: [] });

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
            if (search) params.set("search", search);
            if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
            if (typeFilter === "external") params.set("isExternal", "true");
            if (typeFilter === "internal") params.set("isExternal", "false");
            if (locationFilter && locationFilter !== "all") params.set("location", locationFilter);
            const res = await API.get(`/inquiries?${params.toString()}`);
            const data = res.data?.data || res.data || [];
            setInquiries(data);
            setTotalPages(res.data?.totalPages ?? 1);
            setTotal(res.data?.total ?? 0);

            const locations = [...new Set(data.map(i => i.location).filter(Boolean))];
            setFilterOptions({ locations });
        } catch (err) {
            console.error("Failed to fetch inquiries:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, locationFilter]);
    useEffect(() => { fetchInquiries(); }, [page, search, statusFilter, typeFilter, locationFilter]);

    const getFormPath = (id, action = 'create') => {
        const base = role === 'super_admin' ? '/superadmin' : (role === 'sales' ? '/sales' : (role === 'branch_manager' ? '/branch' : '/company'));
        if (action === 'convert') return `${base}/inquiries/${id}/convert`;
        if (action === 'edit') return `${base}/inquiries/${id}/edit`;
        return `${base}/inquiries/create`;
    };

    const getStatusStyle = (s) => {
        if (s === "Converted") return "bg-[#ecfdf5] text-[#059669]";
        if (s === "Open") return "bg-[#eff6ff] text-[#2563eb]";
        return "bg-[#f1f5f9] text-[#475569]";
    };

    const avatars = ["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#6366f1"];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[18px] font-bold text-[var(--txt)] tracking-tight">Inquiries</h1>
                    <p className="text-[12.5px] text-[var(--txt3)] mt-1">Manage and respond to incoming requests from your website or team.</p>
                </div>
                <button onClick={() => navigate(getFormPath(null, "create"))} className="crm-btn-primary gap-2">
                    <FiPlus size={16} />
                    New Inquiry
                </button>
            </div>

            {/* Filters bar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative group w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--txt4)] group-focus-within:text-[var(--indigo)] transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search inquiries..."
                        className="w-full h-[32px] pl-9 pr-3 bg-white border border-[var(--border2)] rounded-[var(--r)] text-[12.5px] outline-none focus:border-[var(--indigo)] focus:ring-[3px] focus:ring-[rgba(99,102,241,.1)] transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="relative">
                    <select
                        className="h-[32px] pl-3 pr-8 bg-white border border-[var(--border2)] rounded-[var(--r)] text-[12px] font-medium text-[var(--txt2)] outline-none focus:border-[var(--indigo)] transition-all appearance-none cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="Open">Open</option>
                        <option value="Converted">Converted</option>
                    </select>
                    <FiFilter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--txt4)] pointer-events-none" />
                </div>

                <div className="relative">
                    <select
                        className="h-[32px] pl-3 pr-8 bg-white border border-[var(--border2)] rounded-[var(--r)] text-[12px] font-medium text-[var(--txt2)] outline-none focus:border-[var(--indigo)] transition-all appearance-none cursor-pointer"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="external">External</option>
                        <option value="internal">Internal</option>
                    </select>
                    <FiGlobe size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--txt4)] pointer-events-none" />
                </div>
            </div>

            {/* List */}
            <div className="crm-card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="crm-table-header">Inquirer</th>
                                <th className="crm-table-header">Location</th>
                                <th className="crm-table-header">Message</th>
                                <th className="crm-table-header">Status</th>
                                <th className="crm-table-header text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center text-[var(--txt4)] text-[12px] font-bold uppercase tracking-widest">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-6 h-6 border-2 border-[var(--indigo-l)] border-t-[var(--indigo)] rounded-full animate-spin" />
                                            Loading inquiries...
                                        </div>
                                    </td>
                                </tr>
                            ) : inquiries.length > 0 ? (
                                inquiries.map((item, idx) => (
                                    <tr 
                                        key={item._id} 
                                        onClick={() => navigate(getFormPath(item._id, "edit"))}
                                        className="crm-table-row cursor-pointer"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${avatars[idx % avatars.length]}, #fff3)` }}>
                                                    {(item.name || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-semibold text-[var(--txt)] truncate">{item.name}</p>
                                                    <p className="text-[11.5px] text-[var(--txt3)] truncate leading-tight mt-0.5">{item.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-[12.5px] text-[var(--txt2)] font-medium">{item.location || "---"}</td>
                                        <td className="px-5 py-3.5 text-[12.5px] text-[var(--txt4)] line-clamp-1 max-w-xs">{item.message || "---"}</td>
                                        <td className="px-5 py-3.5">
                                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider gap-1.5 ${getStatusStyle(item.status)}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-currentColor" />
                                                {item.status}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                {item.status === "Open" ? (
                                                    <button
                                                        onClick={() => navigate(getFormPath(item._id, "convert"))}
                                                        className="text-[11px] font-bold text-[var(--indigo)] hover:underline flex items-center gap-1 bg-[var(--indigo-l)] px-2.5 py-1 rounded-md transition-all active:scale-95"
                                                    >
                                                        Convert <FiChevronRight size={14} />
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-[var(--txt4)] text-[11px] font-bold px-2 py-1">
                                                        <FiCheckCircle size={14} /> Converted
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center text-[var(--txt4)] text-[12.5px]">No inquiries found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
        </div >
    );
};

export default InquiriesPage;

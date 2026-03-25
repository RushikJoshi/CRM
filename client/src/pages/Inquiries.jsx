import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiInbox, FiSearch, FiMail, FiGlobe, FiFilter,
    FiPlus, FiChevronRight, FiCheckCircle, FiX
} from "react-icons/fi";
import API from "../services/api";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";
import AddInquiryModal from "../components/AddInquiryModal";

const InquiriesPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    const [activeTask, setActiveTask] = useState(null); // 'create', 'edit'
    const [editingInquiry, setEditingInquiry] = useState(null);

    const currentUser = getCurrentUser();
    const role = currentUser?.role;

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
            if (search) params.set("search", search);
            if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
            if (typeFilter === "external") params.set("isExternal", "true");
            if (typeFilter === "internal") params.set("isExternal", "false");
            
            const res = await API.get(`/inquiries?${params.toString()}`);
            const data = res.data?.data || res.data || [];
            setInquiries(data);
            setTotalPages(res.data?.totalPages ?? 1);
            setTotal(res.data?.total ?? 0);
        } catch (err) {
            console.error("Failed to fetch inquiries:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter]);
    useEffect(() => { fetchInquiries(); }, [page, search, statusFilter, typeFilter]);

    const handleConvert = (id) => {
        const base = role === 'super_admin' ? '/superadmin' : (role === 'sales' ? '/sales' : (role === 'branch_manager' ? '/branch' : '/company'));
        navigate(`${base}/inquiries/${id}/convert`);
    };

    const closeTask = () => {
        setActiveTask(null);
        setEditingInquiry(null);
        fetchInquiries();
    };

    if (activeTask === 'create' || activeTask === 'edit') {
        return (
            <div className="animate-fade-in bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                <AddInquiryModal 
                    isOpen={true} 
                    onClose={closeTask} 
                    onSuccess={closeTask}
                    editingData={editingInquiry}
                    isStandalone={true}
                />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-3 pb-4">
            {/* Excel Filter Header */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm overflow-x-auto text-left">
                <div className="relative group min-w-[240px]">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={12} />
                    <input
                        type="text"
                        placeholder="Search inquiries by name or email..."
                        className="w-full h-8 pl-9 pr-3 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium outline-none focus:bg-white focus:border-teal-600/20 focus:ring-4 focus:ring-teal-600/5 transition-all text-slate-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="h-4 w-px bg-slate-100 mx-1" />

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FiFilter size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            className="h-8 pl-8 pr-8 bg-slate-50 border border-transparent rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:bg-white focus:border-teal-600/20 transition-all appearance-none cursor-pointer min-w-[130px]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="Open">Open</option>
                            <option value="Converted">Converted</option>
                        </select>
                    </div>

                    <div className="relative">
                        <FiGlobe size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            className="h-8 pl-8 pr-8 bg-slate-50 border border-transparent rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:bg-white focus:border-teal-600/20 transition-all appearance-none cursor-pointer min-w-[120px]"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">All Origins</option>
                            <option value="external">External</option>
                            <option value="internal">Internal</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setActiveTask('create')}
                        className="btn-saas-primary h-8 px-4 text-[11px] gap-2 ml-auto shrink-0"
                    >
                        <FiPlus size={14} /> New Inquiry
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Hydrating Records...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="saas-table-excel-container text-left">
                        <table className="saas-table-excel">
                            <thead>
                                <tr>
                                    <th className="saas-th-excel">Inquirer Profile</th>
                                    <th className="saas-th-excel">Location</th>
                                    <th className="saas-th-excel">Status & Meta</th>
                                    <th className="saas-th-excel text-right px-6">Engagement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {inquiries.map((item, idx) => (
                                    <tr 
                                        key={item._id} 
                                        className="saas-tr-excel group cursor-pointer"
                                        onClick={() => { setEditingInquiry(item); setActiveTask('edit'); }}
                                    >
                                        <td className="saas-td-excel">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-6 h-6 rounded bg-teal-50 flex items-center justify-center text-teal-600 font-black text-[9px] uppercase shrink-0 border border-teal-100">
                                                    {(item.name || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-800 text-[12px] truncate group-hover:text-teal-600 transition-colors leading-tight">{item.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter truncate opacity-70 mt-0.5">{item.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="saas-td-excel">
                                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{item.location || "N/A"}</span>
                                        </td>
                                        <td className="saas-td-excel">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                                    item.status === 'Converted' 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                }`}>
                                                    {item.status}
                                                </span>
                                                <span className="text-[10px] text-slate-300 font-black tracking-tighter uppercase opacity-50">
                                                    {item.source || "Manual"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="saas-td-excel text-right px-6" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1.5 translate-x-3">
                                                {item.status === "Open" ? (
                                                    <button
                                                        onClick={() => handleConvert(item._id)}
                                                        className="h-7 px-3 bg-teal-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-teal-700 transition-all active:scale-95 shadow-lg shadow-teal-600/20"
                                                    >
                                                        Convert <FiChevronRight size={12} strokeWidth={3} />
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100/50">
                                                        <FiCheckCircle size={12} /> Resolved
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {inquiries.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center bg-white">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No inquiries pending</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between">
                         <div className="text-[12px] text-slate-500 font-medium">
                            Showing <span className="text-slate-900 font-bold">{inquiries.length}</span> of <span className="text-slate-900 font-bold">{total}</span> total inquires
                         </div>
                         <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default InquiriesPage;

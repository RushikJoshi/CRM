import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiSearch, FiGlobe, FiFilter, FiChevronRight, FiCheckCircle
} from "react-icons/fi";
import API from "../services/api";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";
import InquiryAssignModal from "../components/InquiryAssignModal";

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

    const [assignInquiry, setAssignInquiry] = useState(null);

    const currentUser = getCurrentUser();
    const role = currentUser?.role;

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
            if (search) params.set("search", search);
            if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
            if (typeFilter && typeFilter !== "all") params.set("source", typeFilter);
            
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

    const prevFiltersRef = React.useRef({ search, statusFilter, typeFilter });

    useEffect(() => {
        // Intelligent Fetch Logic: Prevents double-hits when filters change
        const filtersChanged = 
            prevFiltersRef.current.search !== search || 
            prevFiltersRef.current.statusFilter !== statusFilter || 
            prevFiltersRef.current.typeFilter !== typeFilter;

        if (filtersChanged && page !== 1) {
            setPage(1);
            prevFiltersRef.current = { search, statusFilter, typeFilter };
            return; // Let the next cycle triggered by setPage(1) do the fetch
        }

        prevFiltersRef.current = { search, statusFilter, typeFilter };
        fetchInquiries();
    }, [page, search, statusFilter, typeFilter]);

    const handleConvert = (id) => {
        const base = role === 'super_admin' ? '/superadmin' : (role === 'sales' ? '/sales' : (role === 'branch_manager' ? '/branch' : '/company'));
        navigate(`${base}/inquiries/${id}/convert`);
    };

    const closeAssignTask = () => {
        setAssignInquiry(null);
        fetchInquiries();
    };

    const handleMerge = async (item) => {
        if (!item?._id) return;
        if (!window.confirm(`Merge this duplicate inquiry into the oldest matching inquiry for ${item.name}?`)) return;
        try {
            await API.post(`/inquiries/${item._id}/merge`);
            toast.success("Duplicate inquiry merged.");
            fetchInquiries();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to merge inquiry.");
        }
    };

    if (assignInquiry) {
        return (
            <div className="animate-fade-in bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                <InquiryAssignModal 
                    isOpen={true} 
                    onClose={closeAssignTask} 
                    inquiry={assignInquiry} 
                    onAssigned={closeAssignTask}
                />
            </div>
        );
    }

    return (
        <div className="crm-page animate-fade-in space-y-3 pb-4">
            {/* Excel Filter Header */}
            <div className="crm-toolbar text-left">
                <div className="relative group min-w-[240px]">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={12} />
                    <input
                        type="text"
                        placeholder="Search inquiries by name or email..."
                        className="crm-input pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="h-4 w-px bg-slate-100 mx-1" />

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FiFilter size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                className="crm-input pl-8 pr-8 min-w-[130px]"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="qualified">Qualified</option>
                                <option value="converted">Converted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="relative">
                            <FiGlobe size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                className="crm-input pl-8 pr-8 min-w-[120px]"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="all">All Sources</option>
                                <option value="website">Website</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="manual">Manual</option>
                                <option value="ads">Ads</option>
                                <option value="test_portal">Test Portal</option>
                            </select>
                        </div>
                </div>
            </div>

            {loading ? (
                    <div className="crm-card p-20 flex flex-col items-center justify-center space-y-4">
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
                                        <th className="saas-th-excel text-center">Source</th>
                                        <th className="saas-th-excel">Assigned To</th>
                                        <th className="saas-th-excel">Status</th>
                                        <th className="saas-th-excel text-right px-6">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {inquiries.map((item) => (
                                        <tr 
                                            key={item._id} 
                                            className="saas-tr-excel group cursor-pointer"
                                            onClick={() => {
                                                const base = role === 'super_admin' ? '/superadmin' : (role === 'sales' ? '/sales' : (role === 'branch_manager' ? '/branch' : '/company'));
                                                navigate(`${base}/inquiries/${item._id}`);
                                            }}
                                        >
                                            <td className="saas-td-excel">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-800 text-[12px] truncate group-hover:text-teal-600 transition-colors leading-tight">{item.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter truncate opacity-70 mt-0.5">{item.email}</div>
                                                        {item.duplicateCount > 0 && (
                                                            <div className="mt-1 inline-flex px-2 py-0.5 rounded bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100">
                                                                {item.duplicateCount} Duplicate{item.duplicateCount > 1 ? "s" : ""}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="saas-td-excel text-center">
                                                <span className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border border-slate-100">
                                                    {item.source || "manual"}
                                                </span>
                                            </td>
                                             <td className="saas-td-excel" onClick={(e) => { 
                                                 e.stopPropagation(); 
                                                 setAssignInquiry(item);
                                             }}>
                                                 <div className="flex items-center gap-2 cursor-pointer group/user">
                                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight group-hover/user:text-teal-600 transition-colors">
                                                        {item.assignedTo?.name || "Unassigned"}
                                                    </span>
                                                 </div>
                                             </td>
                                            <td className="saas-td-excel">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                                    item.status === 'converted' 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                    : item.status === 'rejected'
                                                    ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="saas-td-excel text-right px-6" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5 translate-x-3">
                                                    {item.duplicateCount > 0 && (
                                                        <button
                                                            onClick={() => handleMerge(item)}
                                                            className="h-7 px-3 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-amber-100 transition-all active:scale-95 border border-amber-100"
                                                        >
                                                            Merge
                                                        </button>
                                                    )}
                                                    {item.status !== "converted" ? (
                                                        <button
                                                            onClick={() => handleConvert(item._id)}
                                                            className="h-7 px-4 bg-teal-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-teal-700 transition-all active:scale-95 shadow-lg shadow-teal-600/20"
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
                                            <td colSpan={5} className="px-6 py-20 text-center bg-white">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No inquiries pending</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                    </div>
                    <div className="flex items-center justify-end">
                         <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default InquiriesPage;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import LeadTable from "../components/LeadTable";
import LeadAssignModal from "../components/LeadAssignModal";
import AddTaskModal from "../components/AddTaskModal";
import BulkUpdateModal from "../components/BulkUpdateModal";
import LeadImportModal from "../components/LeadImportModal";
import Pagination from "../components/Pagination";
import { FiPlus, FiSearch, FiFilter, FiUpload } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

function Leads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;
    const [viewLead, setViewLead] = useState(null);
    const [assignLead, setAssignLead] = useState(null);
    const [taskLead, setTaskLead] = useState(null);
    const [importLead, setImportLead] = useState(false);
    const [bulkActionInfo, setBulkActionInfo] = useState({ ids: [], action: "", open: false });
    const navigate = useNavigate();
    const toast = useToast();

    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/leads" : "/leads";

    const formBase = (() => {
        const path = window.location.pathname;
        if (path.startsWith("/superadmin")) return "/superadmin/leads";
        if (path.startsWith("/company")) return "/company/leads";
        if (path.startsWith("/branch")) return "/branch/leads";
        if (path.startsWith("/sales")) return "/sales/leads";
        return "/leads";
    })();

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await API.get(`${apiBase}?search=${encodeURIComponent(search)}&status=${statusFilter}&page=${page}&limit=${pageSize}`);
            const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setLeads(data);
            setTotalPages(res.data?.totalPages ?? 1);
            setTotal(res.data?.total ?? data.length);
        } catch {
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this lead?")) return;
        try {
            await API.delete(`${apiBase}/${id}`);
            toast.success("Lead deleted.");
            fetchLeads();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete lead.");
        }
    };

    const handleConvert = async (id) => {
        if (!window.confirm("Do you want to turn this lead into a customer?")) return;
        try {
            await API.post(`/leads/${id}/convert`);
            toast.success("Lead turned into a customer!");
            fetchLeads();
        } catch (err) {
            toast.error("Error: " + (err.response?.data?.message || err.message));
        }
    };

    const handleBulkAction = async (ids, action, resetSelection) => {
        if (action === 'delete') {
            if (!window.confirm(`Are you sure you want to delete ${ids.length} leads?`)) return;
            try {
                await API.patch("/leads/bulk", { ids, action });
                toast.success(`Deleted ${ids.length} leads successfully.`);
                resetSelection();
                fetchLeads();
            } catch (err) {
                toast.error("Bulk delete failed.");
            }
        } else {
            setBulkActionInfo({ ids, action, open: true, reset: resetSelection });
        }
    };

    useEffect(() => { setPage(1); }, [search, statusFilter]);
    useEffect(() => { fetchLeads(); }, [search, statusFilter, page]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Simple & Clean Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Leads List</h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                        Manage and track your potential customers
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 relative z-10 w-full lg:w-auto">
                    {/* Search Field */}
                    <div className="relative group flex-1 lg:w-64">
                        <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-sm shadow-sm placeholder-gray-300"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Filter Field - Fixed Overlap */}
                    <div className="relative group w-full lg:w-48">
                        <FiFilter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors" />
                        <select
                            className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-sm appearance-none cursor-pointer shadow-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Leads</option>
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="proposal">Proposal</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="closed won">Won</option>
                            <option value="closed lost">Lost</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                            <FiFilter size={14} />
                        </div>
                    </div>

                    {/* Import Lead Button (Manager Only) */}
                    {(currentUser?.role === "branch_manager" || currentUser?.role === "company_admin") && (
                        <button
                            onClick={() => setImportLead(true)}
                            className="flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-gray-700 font-black rounded-2xl border border-gray-200 hover:bg-gray-50 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest min-w-[150px] shadow-sm"
                        >
                            <FiUpload size={18} strokeWidth={3} />
                            Import CSV
                        </button>
                    )}

                    {/* Add Lead Button */}
                    <button
                        onClick={() => navigate(`${formBase}/create`)}
                        className="flex items-center justify-center gap-3 px-8 py-3.5 bg-sky-500 text-white font-black rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest min-w-[180px]"
                    >
                        <FiPlus size={20} strokeWidth={3} />
                        Add New Lead
                    </button>
                </div>
            </div>


            {loading ? (
                <div className="h-[500px] bg-white rounded-[40px] border border-[#E5EAF2] flex flex-col items-center justify-center space-y-6 shadow-sm overflow-hidden relative">
                    <div className="absolute inset-0 bg-blue-500/[0.02] animate-pulse" />
                    <div className="w-16 h-16 border-[6px] border-blue-50 border-t-blue-500 rounded-full animate-spin shadow-lg relative z-10" />
                    <p className="text-[#A0AEC0] font-black uppercase tracking-[0.4em] text-[11px] relative z-10">Loading Leads...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <LeadTable
                            leads={leads}
                            onEdit={(l) => navigate(`${formBase}/${l._id}/edit`)}
                            onDelete={handleDelete}
                            onConvert={handleConvert}
                            onView={(l) => l?._id && navigate(`${formBase}/${l._id}`)}
                            onAssign={(l) => setAssignLead(l)}
                            onAddTask={(l) => setTaskLead(l)}
                            onBulkAction={handleBulkAction}
                        />
                    </div>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                </div>
            )}

            <LeadAssignModal
                isOpen={Boolean(assignLead)}
                onClose={() => setAssignLead(null)}
                lead={assignLead}
                onAssigned={fetchLeads}
            />

            <AddTaskModal
                isOpen={Boolean(taskLead)}
                onClose={() => setTaskLead(null)}
                onSuccess={fetchLeads}
                lead={taskLead}
            />

            <BulkUpdateModal
                isOpen={bulkActionInfo.open}
                onClose={() => setBulkActionInfo({ ...bulkActionInfo, open: false })}
                ids={bulkActionInfo.ids}
                action={bulkActionInfo.action}
                onUpdated={() => {
                    fetchLeads();
                    if (bulkActionInfo.reset) bulkActionInfo.reset();
                }}
            />

            <LeadImportModal
                isOpen={importLead}
                onClose={() => setImportLead(false)}
                onImported={fetchLeads}
            />
        </div>
    );
}

export default Leads;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import LeadTable from "../components/LeadTable";
import LeadAssignModal from "../components/LeadAssignModal";
import AddTaskModal from "../components/AddTaskModal";
import BulkUpdateModal from "../components/BulkUpdateModal";
import LeadImportModal from "../components/LeadImportModal";
import Pagination from "../components/Pagination";
import { FiPlus, FiSearch, FiFilter, FiUpload, FiX, FiDownload } from "react-icons/fi";
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
    const pageSize = 10;
    const [assignLead, setAssignLead] = useState(null);
    const [taskLead, setTaskLead] = useState(null);
    const [importLead, setImportLead] = useState(false);
    const [bulkActionInfo, setBulkActionInfo] = useState({ ids: [], action: "", open: false });
    const navigate = useNavigate();
    const toast = useToast();

    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/leads" : "/leads";

    const role = currentUser?.role;

    const formBase = (() => {
        if (role === 'super_admin') return "/superadmin/leads";
        if (role === 'company_admin') return "/company/leads";
        if (role === 'branch_manager') return "/branch/leads";
        if (role === 'sales') return "/sales/leads";
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

    const [selectedIds, setSelectedIds] = useState([]);

    const handleExportCSV = () => {
        const selectedLeads = leads.filter(l => selectedIds.includes(l._id));
        const headers = ["Name", "Email", "Phone", "Company", "Status", "Value", "Assigned To"];
        const rows = selectedLeads.map(l => [
            l.name || "N/A",
            l.email || "N/A",
            l.phone || "N/A",
            l.companyName || "N/A",
            l.status?.name || l.status || "N/A",
            l.value || 0,
            l.assignedTo?.name || "Unassigned"
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Leads_Export_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSelectedIds([]);
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

    const [activeTask, setActiveTask] = useState(null); // 'import', 'assign', 'bulk', 'task'

    const closeTask = () => setActiveTask(null);

    useEffect(() => { setPage(1); }, [search, statusFilter]);
    useEffect(() => { fetchLeads(); }, [search, statusFilter, page]);

    if (activeTask === 'import') {
        return (
            <div className="animate-fade-in bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                <LeadImportModal 
                    isOpen={true} 
                    onClose={closeTask} 
                    onImported={() => { fetchLeads(); closeTask(); }} 
                    isStandalone={true}
                />
            </div>
        );
    }

    if (activeTask === 'assign' && assignLead) {
        return (
            <div className="animate-fade-in bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                <LeadAssignModal 
                    isOpen={true} 
                    onClose={closeTask} 
                    lead={assignLead} 
                    onAssigned={() => { fetchLeads(); closeTask(); }} 
                    isStandalone={true}
                />
            </div>
        );
    }

    if (activeTask === 'bulk' && bulkActionInfo.open) {
        return (
            <div className="animate-fade-in bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                <BulkUpdateModal 
                    isOpen={true} 
                    onClose={closeTask} 
                    ids={bulkActionInfo.ids} 
                    action={bulkActionInfo.action} 
                    onUpdated={() => { bulkActionInfo.reset?.(); fetchLeads(); closeTask(); }} 
                    isStandalone={true}
                />
            </div>
        );
    }

    if (activeTask === 'task' && taskLead) {
        return (
            <div className="animate-fade-in bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                <AddTaskModal 
                    isOpen={true} 
                    onClose={closeTask} 
                    onSuccess={() => { fetchLeads(); closeTask(); }} 
                    lead={taskLead} 
                    isStandalone={true}
                />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-3 pb-4">
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
                <div className="relative group min-w-[240px]">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={12} />
                    <input
                        type="text"
                        placeholder="Search leads by name or email..."
                        className="w-full h-8 pl-9 pr-3 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium outline-none focus:bg-white focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-600/5 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {(role === "branch_manager" || role === "company_admin" || role === "super_admin") && (
                    <button
                        onClick={() => setActiveTask('import')}
                        className="btn-saas-secondary h-8 px-4 shrink-0 border-dashed text-[11px]"
                    >
                        <FiUpload size={12} className="mr-2 opacity-50" />
                        Import CSV
                    </button>
                )}

                <div className="h-4 w-px bg-slate-100 mx-1" />

                {selectedIds.length > 0 ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">{selectedIds.length} Selected</span>
                        <button onClick={handleExportCSV} className="btn-saas-secondary h-7 px-2.5 text-[10px]">Export</button>
                        <button onClick={() => { setBulkActionInfo({ ids: selectedIds, action: 'assign_user', reset: () => setSelectedIds([]) }); setActiveTask('bulk'); }} className="btn-saas-secondary h-7 px-2.5 text-[10px]">Reassign</button>
                        <button onClick={() => handleBulkAction(selectedIds, 'delete', () => setSelectedIds([]))} className="btn-saas-secondary h-7 px-2.5 text-[10px] text-rose-600 hover:bg-rose-50 border-rose-100">Delete</button>
                        <button onClick={() => setSelectedIds([])} className="p-1 text-slate-400 hover:text-slate-600"><FiX size={12} /></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <FiFilter size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                className="h-8 pl-8 pr-8 bg-slate-50 border border-transparent rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-600/20 transition-all appearance-none cursor-pointer min-w-[130px]"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="new">New / Fresh</option>
                                <option value="contacted">Contacted</option>
                                <option value="qualified">Qualified</option>
                                <option value="proposal">Out for Proposal</option>
                                <option value="negotiation">Negotiation</option>
                                <option value="closed won">Closed Won</option>
                                <option value="closed lost">Closed Lost</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Table Section */}
            {loading ? (
                <div className="saas-card p-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Hydrating Records...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <LeadTable
                        leads={leads}
                        selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds}
                        onEdit={(l) => navigate(`${formBase}/${l._id}/edit`)}
                        onDelete={handleDelete}
                        onConvert={handleConvert}
                        onView={(l) => l?._id && navigate(`${formBase}/${l._id}`)}
                        onAssign={(l) => { setAssignLead(l); setActiveTask('assign'); }}
                        onAddTask={(l) => { setTaskLead(l); setActiveTask('task'); }}
                        onBulkAction={handleBulkAction}
                    />
                    <div className="flex items-center justify-end">
                         <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Leads;

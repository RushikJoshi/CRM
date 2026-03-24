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

    useEffect(() => { setPage(1); }, [search, statusFilter]);
    useEffect(() => { fetchLeads(); }, [search, statusFilter, page]);

    return (
        <div className="space-y-6">
            {/* Unified Action Bar */}
            <div className="flex items-center gap-4 bg-white p-3 rounded-[var(--r-md)] border border-[var(--border)] shadow-sm">
                <div className="relative group w-64 shrink-0">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--txt4)] group-focus-within:text-[var(--indigo)] transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        className="w-full h-[32px] pl-9 pr-3 bg-[var(--surface2)] border border-[var(--border2)] rounded-[var(--r)] text-[13px] outline-none focus:border-[var(--indigo)] focus:ring-[3px] focus:ring-[rgba(99,102,241,.08)] transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {selectedIds.length > 0 ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
                        <div className="h-4 w-px bg-[var(--border2)] mx-2" />
                        <span className="text-[11px] font-bold text-[var(--indigo)] bg-[var(--indigo-l)] px-2.5 py-1 rounded-md uppercase tracking-wider">{selectedIds.length} Selected</span>
                        <button onClick={handleExportCSV} className="crm-btn-secondary h-[32px] text-[11px] px-3">Export</button>
                        <button onClick={() => handleBulkAction(selectedIds, 'assign_user', () => setSelectedIds([]))} className="crm-btn-secondary h-[32px] text-[11px] px-3">Reassign</button>
                        <button onClick={() => handleBulkAction(selectedIds, 'delete', () => setSelectedIds([]))} className="crm-btn-secondary h-[32px] text-[11px] px-3 text-[var(--danger)] hover:bg-[var(--danger-l)]">Delete</button>
                        <button onClick={() => setSelectedIds([])} className="p-1.5 text-[var(--txt4)] hover:text-[var(--txt2)]"><FiX size={14} /></button>
                    </div>
                ) : (
                    <>
                        <div className="relative">
                            <select
                                className="h-[32px] pl-3 pr-8 bg-[var(--surface2)] border border-[var(--border2)] rounded-[var(--r)] text-[12px] font-bold text-[var(--txt2)] outline-none focus:border-[var(--indigo)] transition-all appearance-none cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="qualified">Qualified</option>
                                <option value="proposal">Proposal</option>
                                <option value="negotiation">Negotiation</option>
                                <option value="closed won">Won</option>
                                <option value="closed lost">Lost</option>
                            </select>
                            <FiFilter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--txt4)] pointer-events-none" />
                        </div>

                        <div className="flex-1" />

                        {(role === "branch_manager" || role === "company_admin" || role === "super_admin") && (
                            <button
                                onClick={() => setImportLead(true)}
                                className="crm-btn-secondary h-[32px] gap-2 px-3 text-[11px] font-bold"
                            >
                                <FiUpload size={14} />
                                IMPORT CSV
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Table Section */}
            {loading ? (
                <div className="crm-card p-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-3 border-[var(--indigo-l)] border-t-[var(--indigo)] rounded-full animate-spin" />
                    <p className="text-[var(--txt3)] text-[11px] font-bold uppercase tracking-widest">Loading Leads...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="crm-card p-0 overflow-hidden">
                        <LeadTable
                            leads={leads}
                            selectedIds={selectedIds}
                            setSelectedIds={setSelectedIds}
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

            {/* Modals */}
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
                    bulkActionInfo.reset?.();
                    fetchLeads();
                }}
            />
            <LeadImportModal
                isOpen={importLead}
                onClose={() => setImportLead(false)}
                onSuccess={fetchLeads}
            />
        </div>
    );
}

export default Leads;

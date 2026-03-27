import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import LeadTable from "../components/LeadTable";
import AddTaskModal from "../components/AddTaskModal";
import BulkUpdateModal from "../components/BulkUpdateModal";
import Pagination from "../components/Pagination";
import { FiSearch, FiTarget } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

function Prospects() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 100;
    const [taskLead, setTaskLead] = useState(null);
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
            const res = await API.get(`${apiBase}?search=${encodeURIComponent(search)}&stage=qualified,prospect&page=${page}&limit=${pageSize}`);
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

    const handleConvert = async (id) => {
        if (!window.confirm("Do you want to convert this prospect into a Deal/Account?")) return;
        try {
            await API.post(`/leads/${id}/convert`);
            toast.success("Prospect converted successfully!");
            fetchLeads();
        } catch (err) {
            toast.error("Error: " + (err.response?.data?.message || err.message));
        }
    };

    const handleBulkAction = async (ids, action, resetSelection) => {
        if (action === 'delete') {
            if (!window.confirm(`Are you sure you want to delete ${ids.length} prospects?`)) return;
            try {
                await API.patch("/leads/bulk", { ids, action });
                toast.success(`Deleted ${ids.length} items.`);
                resetSelection();
                fetchLeads();
            } catch (err) {
                toast.error("Bulk delete failed.");
            }
        } else {
            setBulkActionInfo({ ids, action, open: true, reset: resetSelection });
        }
    };

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { fetchLeads(); }, [search, page]);

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="w-64 relative">
                    <input
                        type="text"
                        placeholder="Search prospects..."
                        className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-gray-700 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border shadow-sm p-12 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-teal-50 border-t-teal-600 rounded-full animate-spin" />
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Loading Prospects...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border shadow-sm p-4 overflow-hidden">
                        <LeadTable
                            leads={leads}
                            onEdit={(l) => navigate(`${formBase}/${l._id}/edit`)}
                            onDelete={() => { }}
                            onConvert={handleConvert}
                            onView={(l) => navigate(`${formBase}/${l._id}`)}
                            onAssign={() => { }}
                            onAddTask={(l) => setTaskLead(l)}
                            onBulkAction={handleBulkAction}
                        />
                    </div>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                </div>
            )}

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
        </div>
    );
}

export default Prospects;

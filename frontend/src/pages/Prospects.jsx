import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import LeadTable from "../components/LeadTable";
import LeadDetailsModal from "../components/LeadDetailsModal";
import AddTaskModal from "../components/AddTaskModal";
import BulkUpdateModal from "../components/BulkUpdateModal";
import { FiSearch, FiTarget } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

function Prospects() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [viewLead, setViewLead] = useState(null);
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
            // Zoho Style: Prospects are Qualified leads moving towards a deal
            const res = await API.get(`${apiBase}?search=${search}&status=Qualified,Proposal,Negotiation`);
            const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setLeads(data);
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

    useEffect(() => { fetchLeads(); }, [search]);

    return (
        <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
            {/* Header / Pipeline Tracker */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-10 rounded-[32px] border border-[#E5EAF2] shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none" />
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                        <FiTarget size={30} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-[#1A202C] tracking-tighter leading-none mb-2">Qualified Prospects</h1>
                        <p className="text-[#A0AEC0] font-black text-[11px] uppercase tracking-[0.3em] opacity-80 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            Active Negotiation & Strategy Phase
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 relative z-10">
                    {/* Search Field */}
                    <div className="relative group w-full lg:w-96">
                        <FiSearch size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Identify high-value prospect..."
                            className="w-full pl-16 pr-8 py-5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-[500px] bg-white rounded-[40px] border border-[#E5EAF2] flex flex-col items-center justify-center space-y-6 shadow-sm overflow-hidden relative">
                    <div className="absolute inset-0 bg-blue-500/[0.02] animate-pulse" />
                    <div className="w-16 h-16 border-[6px] border-blue-50 border-t-blue-500 rounded-full animate-spin shadow-lg relative z-10" />
                    <p className="text-[#A0AEC0] font-black uppercase tracking-[0.4em] text-[11px] relative z-10">Filtering Node Intelligence...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <LeadTable
                        leads={leads}
                        onEdit={(l) => navigate(`${formBase}/${l._id}/edit`)}
                        onDelete={() => { }} // Disabled or as needed
                        onConvert={handleConvert}
                        onView={(l) => setViewLead(l)}
                        onAssign={() => { }}
                        onAddTask={(l) => setTaskLead(l)}
                        onBulkAction={handleBulkAction}
                    />
                </div>
            )}

            <LeadDetailsModal
                isOpen={Boolean(viewLead)}
                onClose={() => setViewLead(null)}
                lead={viewLead}
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
        </div>
    );
}

export default Prospects;

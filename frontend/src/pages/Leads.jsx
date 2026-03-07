import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import LeadTable from "../components/LeadTable";
import LeadDetailsModal from "../components/LeadDetailsModal";
import LeadAssignModal from "../components/LeadAssignModal";
import { FiPlus, FiSearch, FiFilter } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

function Leads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [viewLead, setViewLead] = useState(null);
    const [assignLead, setAssignLead] = useState(null);
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
            const res = await API.get(`${apiBase}?search=${search}&status=${statusFilter}`);
            setLeads(Array.isArray(res.data) ? res.data : []);
        } catch {
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this lead permanently?")) return;
        try {
            await API.delete(`${apiBase}/${id}`);
            toast.success("Lead deleted.");
            fetchLeads();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete lead.");
        }
    };

    const handleConvert = async (id) => {
        if (!window.confirm("Convert this lead to a Customer + Deal?")) return;
        try {
            await API.post(`/leads/${id}/convert`);
            toast.success("Lead converted successfully! Customer and Deal created.");
            fetchLeads();
        } catch (err) {
            toast.error("Conversion failed: " + (err.response?.data?.message || err.message));
        }
    };

    useEffect(() => { fetchLeads(); }, [search, statusFilter]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Leads Pipeline</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-70">
                        Manage and track your acquisition pipeline.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group w-full lg:w-56">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative group w-full lg:w-48">
                        <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm appearance-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="proposal">Proposal</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                    <button
                        onClick={() => navigate(`${formBase}/create`)}
                        className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        <FiPlus size={20} />
                        Add Lead
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 border-[6px] border-green-50 border-t-green-500 rounded-full animate-spin" />
                    <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading Leads...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <LeadTable
                        leads={leads}
                        onEdit={(l) => navigate(`${formBase}/${l._id}/edit`)}
                        onDelete={handleDelete}
                        onConvert={handleConvert}
                        onView={(l) => setViewLead(l)}
                        onAssign={(l) => setAssignLead(l)}
                    />
                </div>
            )}

            <LeadDetailsModal
                isOpen={Boolean(viewLead)}
                onClose={() => setViewLead(null)}
                lead={viewLead}
            />

            <LeadAssignModal
                isOpen={Boolean(assignLead)}
                onClose={() => setAssignLead(null)}
                lead={assignLead}
                onAssigned={fetchLeads}
            />
        </div>
    );
}

export default Leads;

import { useEffect, useState } from "react";
import API from "../services/api";
import LeadTable from "../components/LeadTable";
import AddLeadModal from "../components/AddLeadModal";
import LeadDetailsModal from "../components/LeadDetailsModal";
import { FiPlus, FiSearch, FiTarget, FiFilter } from "react-icons/fi";

function Leads() {
    const [leads, setLeads] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [selectedLeadForView, setSelectedLeadForView] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role;
    const isSuperAdmin = role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/leads" : "/leads";

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const url = `${apiBase}?search=${search}&status=${statusFilter}`;
            const res = await API.get(url);
            setLeads(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrEdit = async (formData) => {
        try {
            if (editingLead) {
                await API.put(`${apiBase}/${editingLead._id}`, formData);
            } else {
                await API.post(apiBase, formData);
            }
            fetchLeads();
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Confirm deletion of prospect log? This action is irreversible.")) {
            try {
                await API.delete(`${apiBase}/${id}`);
                fetchLeads();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleConvert = async (id) => {
        if (window.confirm("Convert this lead to a Customer and create an Opportunity Deal?")) {
            try {
                await API.post(`${apiBase}/${id}/convert`);
                alert("Lead Converted Successfully!");
                fetchLeads();
            } catch (err) {
                console.error(err);
                alert("Conversion failed: " + (err.response?.data?.message || err.message));
            }
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [search, statusFilter]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Market Intelligence</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-70">Acquisition Pipeline Tracking</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group w-full lg:w-56">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find records..."
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
                            <option value="">Global Pipeline...</option>
                            <option value="new">New Inbound</option>
                            <option value="contacted">In Contact</option>
                            <option value="qualified">Qualified Assets</option>
                            <option value="proposal">Proposals Sent</option>
                            <option value="closed">Closed Archive</option>
                        </select>
                    </div>
                    <button
                        onClick={() => { setEditingLead(null); setIsModalOpen(true); }}
                        className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        <FiPlus size={20} />
                        Initialize Lead
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 border-[6px] border-green-50 border-t-green-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Filtering Market Logs...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <LeadTable
                        leads={leads}
                        onEdit={(l) => { setEditingLead(l); setIsModalOpen(true); }}
                        onDelete={handleDelete}
                        onConvert={handleConvert}
                        onView={(l) => { setSelectedLeadForView(l); setIsViewModalOpen(true); }}
                    />
                </div>
            )}

            <AddLeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddOrEdit}
                editingData={editingLead}
            />

            <LeadDetailsModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                lead={selectedLeadForView}
            />
        </div>
    );
}

export default Leads;

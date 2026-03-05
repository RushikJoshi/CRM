import { useEffect, useState } from "react";
import API from "../services/api";
import DealPipeline from "../components/DealPipeline";
import AddDealModal from "../components/AddDealModal";
import { FiPlus, FiFilter, FiSearch, FiTrendingUp } from "react-icons/fi";

function Deals() {
    const [deals, setDeals] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState(null);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        companyId: "",
        stage: ""
    });

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role;
    const isSuperAdmin = role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/deals" : "/deals";
    const apiBasePublic = "/deals"; // For POST

    const fetchDeals = async () => {
        setLoading(true);
        try {
            const url = `${apiBase}?stage=${filters.stage}${isSuperAdmin ? `&companyId=${filters.companyId}` : ""}`;
            const res = await API.get(url);
            setDeals(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrEdit = async (formData) => {
        try {
            if (editingDeal) {
                await API.put(`${apiBase}/${editingDeal._id}`, formData);
            } else {
                await API.post(apiBasePublic, formData);
            }
            fetchDeals();
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMoveDeal = async (id, newStage) => {
        try {
            await API.put(`${apiBase}/${id}`, { stage: newStage });
            fetchDeals();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Confirm purge of capital deal? Lost value will be recorded in logs.")) {
            try {
                await API.delete(`${apiBase}/${id}`);
                fetchDeals();
            } catch (err) {
                console.error(err);
            }
        }
    };

    useEffect(() => {
        fetchDeals();
    }, [filters]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Active Pipeline</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">Capital Yield Visualization</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group w-full lg:w-48">
                        <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <select
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm appearance-none shadow-sm cursor-pointer"
                            value={filters.companyId}
                            onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
                        >
                            <option value="">Global Filter...</option>
                        </select>
                    </div>
                    <button
                        onClick={() => { setEditingDeal(null); setIsModalOpen(true); }}
                        className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        <FiPlus size={20} />
                        Initialize Deal
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-[6px] border-green-50 border-t-green-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Scanning Value Nodes...</p>
                </div>
            ) : (
                <div className="overflow-x-auto overflow-y-hidden">
                    <DealPipeline
                        deals={deals}
                        onEdit={(d) => { setEditingDeal(d); setIsModalOpen(true); }}
                        onMove={handleMoveDeal}
                        onDelete={handleDelete}
                    />
                </div>
            )}

            <AddDealModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddOrEdit}
                editingData={editingDeal}
            />
        </div>
    );
}

export default Deals;

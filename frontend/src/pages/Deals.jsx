import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import DealPipeline from "../components/DealPipeline";
import { FiPlus, FiFilter, FiTrendingUp } from "react-icons/fi";
import { getCurrentUser } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AddTaskModal from "../components/AddTaskModal";

function Deals() {
    const navigate = useNavigate();
    const toast = useToast();
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ companyId: "", stage: "" });
    const [taskDeal, setTaskDeal] = useState(null);

    const currentUser = getCurrentUser();
    const role = currentUser?.role;
    const isSuperAdmin = role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/deals" : "/deals";

    const fetchDeals = async () => {
        setLoading(true);
        try {
            const url = `${apiBase}?stage=${filters.stage}${isSuperAdmin ? `&companyId=${filters.companyId}` : ""}`;
            const res = await API.get(url);
            const dealsData = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setDeals(dealsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMoveDeal = async (id, newStage) => {
        try {
            await API.put(`${apiBase}/${id}`, { stage: newStage });
            toast.success(`Deal moved to ${newStage}`);
            fetchDeals();
        } catch (err) {
            toast.error("Failed to move deal.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this deal?")) {
            try {
                await API.delete(`${apiBase}/${id}`);
                toast.success("Deal deleted.");
                fetchDeals();
            } catch (err) {
                toast.error("Failed to delete deal.");
            }
        }
    };

    useEffect(() => {
        fetchDeals();
    }, [filters]);

    const getFormPath = (id) => {
        const base = isSuperAdmin ? "/superadmin" : (role === "sales" ? "/sales" : (role === "branch_manager" ? "/branch" : "/company"));
        return id ? `${base}/deals/${id}/edit` : `${base}/deals/create`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-16">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Deals Pipeline</h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-2">
                        <FiTrendingUp className="text-sky-500" />
                        Manage your sales pipeline and deal stages
                    </p>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <button
                        onClick={() => navigate(getFormPath())}
                        className="flex items-center gap-4 px-8 py-3.5 bg-sky-500 text-white font-black rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest duration-300"
                    >
                        <FiPlus size={20} strokeWidth={3} />
                        Add New Deal
                    </button>
                </div>
            </div>


            {loading ? (
                <div className="h-[500px] flex flex-col items-center justify-center space-y-6 bg-white/50 rounded-[32px] border border-[#E5EAF2] border-dashed">
                    <div className="w-16 h-16 border-[6px] border-blue-50 border-t-blue-500 rounded-full animate-spin shadow-lg"></div>
                    <p className="text-[#A0AEC0] font-black uppercase tracking-[0.3em] text-[11px]">Aggregating Pipeline Data...</p>
                </div>
            ) : (
                <div className="overflow-x-auto overflow-y-hidden pb-4">
                    <div className="min-w-[1200px]">
                        <DealPipeline
                            deals={deals}
                            onEdit={(d) => navigate(getFormPath(d._id))}
                            onMove={handleMoveDeal}
                            onDelete={handleDelete}
                            onAddTask={(d) => setTaskDeal(d)}
                        />
                    </div>
                </div>
            )}

            <AddTaskModal
                isOpen={Boolean(taskDeal)}
                onClose={() => setTaskDeal(null)}
                onSuccess={fetchDeals}
                deal={taskDeal}
            />
        </div>
    );
}

export default Deals;

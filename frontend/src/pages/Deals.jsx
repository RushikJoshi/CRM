import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import DealPipeline from "../components/DealPipeline";
import { FiPlus, FiFilter, FiTrendingUp } from "react-icons/fi";
import { getCurrentUser } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Deals() {
    const navigate = useNavigate();
    const toast = useToast();
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ companyId: "", stage: "" });

    const currentUser = getCurrentUser();
    const role = currentUser?.role;
    const isSuperAdmin = role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/deals" : "/deals";

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
        if (window.confirm("Confirm purge of capital deal? Lost value will be recorded in logs.")) {
            try {
                await API.delete(`${apiBase}/${id}`);
                toast.success("Deal purged.");
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
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:shadow-green-500/5">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Active Pipeline</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">Capital Yield Visualization</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => navigate(getFormPath())}
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
                        onEdit={(d) => navigate(getFormPath(d._id))}
                        onMove={handleMoveDeal}
                        onDelete={handleDelete}
                    />
                </div>
            )}
        </div>
    );
}

export default Deals;

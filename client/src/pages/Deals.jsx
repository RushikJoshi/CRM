import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import DealPipeline from "../components/DealPipeline";
import DealDetailsModal from "../components/DealDetailsModal";
import { FiPlus } from "react-icons/fi";
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
    const [viewDeal, setViewDeal] = useState(null);

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
            await API.put(`${apiBase}/${id}/stage`, { stage: newStage });
            toast.success(`Deal moved to ${newStage}`);
            fetchDeals();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to move deal.");
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

    const base = isSuperAdmin ? "/superadmin" : (role === "sales" ? "/sales" : (role === "branch_manager" ? "/branch" : "/company"));
    const getFormPath = (id) => (id ? `${base}/deals/${id}/edit` : `${base}/deals/create`);
    const getDetailPath = (id) => (id ? `${base}/deals/${id}` : `${base}/deals`);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-16">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">Deal Pipeline</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage your sales pipeline and deal stages</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(getFormPath())}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-sm hover:bg-indigo-600 transition-colors"
                    >
                        <FiPlus size={18} />
                        Add New Deal
                    </button>
                </div>
            </div>


            {loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center gap-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="w-10 h-10 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading deals...</p>
                </div>
            ) : (
                <div className="overflow-x-auto overflow-y-hidden">
                    <div className="min-w-0">
                        <DealPipeline
                            deals={deals}
                            onEdit={(d) => navigate(getFormPath(d._id))}
                            onMove={handleMoveDeal}
                            onDelete={handleDelete}
                            onAddTask={(d) => setTaskDeal(d)}
                            onViewDeal={(deal) => deal?._id && navigate(getDetailPath(deal._id), { state: { deal } })}
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

            <DealDetailsModal
                isOpen={Boolean(viewDeal)}
                onClose={() => { setViewDeal(null); fetchDeals(); }}
                deal={viewDeal}
                onEdit={(deal) => { setViewDeal(null); navigate(getFormPath(deal?._id)); }}
            />
        </div>
    );
}

export default Deals;

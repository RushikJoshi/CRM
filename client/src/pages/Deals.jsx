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
    const [pipeline, setPipeline] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ companyId: "", stage: "" });
    const [taskDeal, setTaskDeal] = useState(null);
    const [viewDeal, setViewDeal] = useState(null);

    const currentUser = getCurrentUser();
    const role = currentUser?.role;
    const isSuperAdmin = role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/deals" : "/deals";

    const fetchPipeline = async () => {
        try {
            // ONE PIPELINE PER COMPANY — GET /pipeline returns a single object
            const res = await API.get("/pipeline");
            const data = res.data?.data || null;

            console.log("PIPELINE DATA:", data);
            console.log("STAGES COUNT:", data?.stages?.length || 0);

            setPipeline(data);
        } catch (err) {
            console.error("PIPELINE FETCH ERROR:", err);
            toast.error("No pipeline found for this company. Contact Super Admin.");
        }
    };

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

    useEffect(() => {
        if (!isSuperAdmin) fetchPipeline();
    }, []);

    const handleMoveDeal = async (id, newStage, newStageId) => {
        try {
            await API.put(`${apiBase}/${id}/stage`, { 
                stage: newStage,
                stageId: newStageId 
            });
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
        <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex-1 min-w-[300px]">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                        Sales Pipeline
                    </span>
                </div>
            </div>


            {loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center gap-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="w-10 h-10 border-2 border-gray-200 border-t-teal-600 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading deals...</p>
                </div>
            ) : (
                <div className="overflow-x-auto overflow-y-hidden">
                    <div className="min-w-0">
                        <DealPipeline
                            deals={deals}
                            stages={pipeline?.stages}
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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Pagination from "../components/Pagination";
import { FiCheckCircle, FiClock, FiAlertCircle, FiSearch, FiCalendar, FiPlus, FiList, FiGrid } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import AddTaskModal from "../components/AddTaskModal";
import TaskKanban from "../components/TaskKanban";
import { getCurrentUser } from "../context/AuthContext";

function Tasks() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState("kanban");
    const toast = useToast();

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/tasks?page=${page}&limit=${pageSize}`);
            const data = res.data?.data || [];
            setTasks(data);
            setTotalPages(res.data?.totalPages ?? 1);
            setTotal(res.data?.total ?? 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { fetchTasks(); }, [page]);

    const handleUpdateStatus = async (id, status) => {
        try {
            // Using PATCH to the updated task controller which now handles Todo model
            await API.patch(`/tasks/${id}`, { status });
            toast.success(`Task marked as ${status}`);
            fetchTasks();
        } catch (err) {
            toast.error("Failed to update task.");
        }
    };

    const getStatusColor = (status) => {
        const s = String(status).toLowerCase();
        if (s === "completed") return "bg-green-50 text-green-600 border-green-100";
        if (s === "pending" || s === "in progress") return "bg-orange-50 text-orange-600 border-orange-100";
        if (s === "cancelled") return "bg-red-50 text-red-600 border-red-100";
        return "bg-gray-50 text-gray-600 border-gray-100";
    };

    const filteredTasks = tasks.filter(t =>
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        t.leadId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.leadId?.companyName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex-1 min-w-[300px] relative group">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-gray-700 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white text-teal-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                            title="List View"
                        >
                            <FiList size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode("kanban")}
                            className={`p-2 rounded-md transition-all ${viewMode === "kanban" ? "bg-white text-teal-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                            title="Kanban View"
                        >
                            <FiGrid size={16} />
                        </button>
                        <button
                            onClick={() => {
                                const user = getCurrentUser();
                                const role = user?.role;
                                const base = role === 'super_admin' ? '/superadmin' : (role === 'sales' ? '/sales' : (role === 'branch_manager' ? '/branch' : '/company'));
                                navigate(`${base}/calendar`);
                            }}
                            className="p-2 text-gray-400 hover:text-teal-600 transition-all"
                            title="Calendar View"
                        >
                            <FiCalendar size={16} />
                        </button>
                    </div>
                </div>
            </div>


            {loading ? (
                <div className="h-[500px] bg-white rounded-[32px] border border-[#E5EAF2] flex flex-col items-center justify-center space-y-6 shadow-sm">
                    <div className="w-16 h-16 border-[6px] border-teal-50 border-t-teal-600 rounded-full animate-spin shadow-lg" />
                    <p className="text-[#A0AEC0] font-black uppercase tracking-[0.3em] text-[11px]">Syncing Task Queue...</p>
                </div>
            ) : viewMode === "kanban" ? (
                <TaskKanban tasks={filteredTasks} onUpdateStatus={handleUpdateStatus} />
            ) : (
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border shadow-sm p-4 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Title</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Lead / Deal</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Due Date</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {filteredTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-24 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No tasks found.</td>
                                        </tr>
                                    ) : (
                                        filteredTasks.map(task => (
                                            <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-bold text-gray-900 text-sm">{task.title}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 font-medium">{task.leadId?.name || task.dealId?.title || "—"}</td>
                                                <td className="px-4 py-3 text-sm text-gray-400 font-bold uppercase tracking-wider">
                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(task.status)}`}>{task.status}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {String(task.status).toLowerCase() !== "completed" && (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleUpdateStatus(task._id, "Completed")} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Complete Task">
                                                                <FiCheckCircle size={18} />
                                                            </button>
                                                            <button onClick={() => handleUpdateStatus(task._id, "Cancelled")} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel Task">
                                                                <FiAlertCircle size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                </div>
            )}

            <AddTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTasks}
            />
        </div>
    );
}

export default Tasks;

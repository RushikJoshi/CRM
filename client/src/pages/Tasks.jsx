import { useEffect, useState } from "react";
import API from "../services/api";
import Pagination from "../components/Pagination";
import { FiCheckCircle, FiClock, FiAlertCircle, FiSearch, FiCalendar, FiPlus, FiList, FiGrid } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import AddTaskModal from "../components/AddTaskModal";
import TaskKanban from "../components/TaskKanban";

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;
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
        <div className="space-y-8 animate-in fade-in duration-700 pb-16">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tasks</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Task management board</p>
                    <p className="text-xs text-gray-400 mt-1">{filteredTasks.length} tasks total</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-100">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            <FiList size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode("kanban")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "kanban" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            <FiGrid size={18} />
                        </button>
                    </div>
                    <div className="relative group flex-1 lg:w-56">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-sm text-gray-700 placeholder-gray-400"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm text-sm"
                    >
                        <FiPlus size={18} /> Add Task
                    </button>
                </div>
            </div>


            {loading ? (
                <div className="h-[500px] bg-white rounded-[32px] border border-[#E5EAF2] flex flex-col items-center justify-center space-y-6 shadow-sm">
                    <div className="w-16 h-16 border-[6px] border-blue-50 border-t-blue-500 rounded-full animate-spin shadow-lg" />
                    <p className="text-[#A0AEC0] font-black uppercase tracking-[0.3em] text-[11px]">Syncing Task Queue...</p>
                </div>
            ) : viewMode === "kanban" ? (
                <TaskKanban tasks={filteredTasks} onUpdateStatus={handleUpdateStatus} />
            ) : (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#F8FAFC]">
                                    <tr className="border-b border-[#E5E7EB]">
                                        <th className="px-6 py-4 text-[10px] font-black text-[#6B7280] uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-[#6B7280] uppercase tracking-wider">Lead / Deal</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-[#6B7280] uppercase tracking-wider">Due Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-[#6B7280] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F0F2F5]">
                                    {filteredTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-24 text-center text-[#6B7280] font-medium">No tasks found.</td>
                                        </tr>
                                    ) : (
                                        filteredTasks.map(task => (
                                            <tr key={task._id} className="hover:bg-[#F8FAFC] transition-colors group">
                                                <td className="px-6 py-4 font-semibold text-[#111827]">{task.title}</td>
                                                <td className="px-6 py-4 text-sm text-[#6B7280]">{task.leadId?.name || task.dealId?.title || "—"}</td>
                                                <td className="px-6 py-4 text-sm text-[#6B7280]">{task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(task.status)}`}>{task.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {String(task.status).toLowerCase() !== "completed" && (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleUpdateStatus(task._id, "Completed")} className="px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-semibold hover:bg-[#1D4ED8]">Complete</button>
                                                            <button onClick={() => handleUpdateStatus(task._id, "Cancelled")} className="px-3 py-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-lg text-xs font-semibold hover:bg-[#E5E7EB]">Cancel</button>
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

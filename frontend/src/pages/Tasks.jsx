import { useEffect, useState } from "react";
import API from "../services/api";
import { FiCheckCircle, FiClock, FiAlertCircle, FiSearch, FiCalendar, FiPlus, FiList, FiGrid } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import AddTaskModal from "../components/AddTaskModal";
import TaskKanban from "../components/TaskKanban";

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState("kanban"); // Default to kanban for "Elite" feel
    const toast = useToast();

    const fetchTasks = async () => {
        try {
            const res = await API.get("/tasks");
            setTasks(res.data?.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Tasks List</h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-2">
                        <FiCheckCircle className="text-sky-500" />
                        Track and manage your daily tasks and follow-ups
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 relative z-10">
                    <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-inner">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === "list" ? "bg-white text-sky-500 shadow-sm" : "text-gray-400 hover:text-gray-500"}`}
                        >
                            <FiList size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode("kanban")}
                            className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === "kanban" ? "bg-white text-sky-500 shadow-sm" : "text-gray-400 hover:text-gray-500"}`}
                        >
                            <FiGrid size={20} />
                        </button>
                    </div>
                    <div className="relative group flex-1 lg:w-64">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-sm shadow-sm placeholder-gray-300"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-3 px-8 py-3.5 bg-sky-500 text-white font-black rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest min-w-[180px]"
                    >
                        <FiPlus size={20} strokeWidth={3} />
                        Add New Task
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTasks.length === 0 ? (
                        <div className="col-span-full py-32 text-center bg-white rounded-[40px] border border-dashed border-[#E5EAF2] group hover:border-blue-200 transition-all duration-700">
                            <div className="w-24 h-24 bg-[#F4F7FB] rounded-full flex items-center justify-center mx-auto mb-6 text-[#CBD5E0] group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-300 transition-all duration-700">
                                <FiCalendar size={48} />
                            </div>
                            <p className="text-[#A0AEC0] font-black uppercase tracking-[0.3em] text-[11px]">No active tasks identified</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <div key={task._id} className="bg-white p-8 rounded-[32px] border border-[#E5EAF2] shadow-sm hover:shadow-2xl transition-all group hover:-translate-y-1 duration-500">
                                <div className="flex items-start justify-between mb-8">
                                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm ${getStatusColor(task.status)?.replace('green', 'blue').replace('emerald', 'blue')}`}>
                                        {task.status}
                                    </div>
                                    <div className="flex items-center gap-2 text-[#CBD5E0] font-black text-[11px] uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                                        <FiClock size={16} />
                                        {new Date(task.dueDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-[#1A202C] group-hover:text-blue-600 transition-colors line-clamp-1 mb-2 tracking-tight">
                                    {task.title}
                                </h3>
                                <div className="flex items-center gap-2 mb-8 pr-4">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                                    <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest truncate leading-none">
                                        {task.leadId?.name || "Independent"} — {task.leadId?.companyName || "No Entity"}
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-6 border-t border-[#F0F2F5]">
                                    {String(task.status).toLowerCase() !== "completed" && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(task._id, "Completed")}
                                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 active:scale-95"
                                            >
                                                <FiCheckCircle size={16} strokeWidth={3} /> EXECUTE
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(task._id, "Cancelled")}
                                                className="px-5 py-3.5 bg-slate-50 text-[#A0AEC0] font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-500 hover:border-red-100 border border-transparent transition-all active:scale-95"
                                            >
                                                <FiAlertCircle size={16} />
                                            </button>
                                        </>
                                    )}
                                    {String(task.status).toLowerCase() === "completed" && (
                                        <div className="w-full py-4 bg-blue-50/50 text-blue-600 text-center font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl border border-blue-100 border-dashed">
                                            Operation Finalized
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
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

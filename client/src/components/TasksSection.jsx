import React, { useState, useEffect } from "react";
import API from "../services/api";
import { FiPlus, FiCheckCircle, FiClock, FiAlertCircle, FiTrash2, FiCalendar } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import Pagination from "./Pagination";

const PAGE_SIZE = 10;
const TasksSection = ({ leadId, customerId, dealId, pageSize = PAGE_SIZE }) => {
    const toast = useToast();
    const [tasks, setTasks] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        dueDate: "",
        priority: "Medium",
        description: ""
    });

    const fetchTasks = async () => {
        try {
            let url = "/crm/todos?";
            if (leadId) url += `leadId=${leadId}&`;
            if (dealId) url += `dealId=${dealId}&`;
            if (customerId) url += `customerId=${customerId}&`;

            const res = await API.get(url);
            setTasks(res.data?.data || []);
        } catch (err) {
            console.error("Tasks fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            await API.post("/crm/todos", {
                ...formData,
                leadId,
                customerId,
                dealId
            });
            toast.success("Task created successfully!");
            setFormData({ title: "", dueDate: "", priority: "Medium", description: "" });
            setShowForm(false);
            fetchTasks();
        } catch (err) {
            toast.error("Failed to add task.");
        }
    };

    const toggleStatus = async (task) => {
        try {
            const nextStatus = task.status === "Completed" ? "Pending" : "Completed";
            await API.put(`/crm/todos/${task._id}`, { status: nextStatus });
            fetchTasks();
        } catch (err) {
            toast.error("Status update failed.");
        }
    };

    const deleteTask = async (id) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await API.delete(`/crm/todos/${id}`);
            fetchTasks();
        } catch (err) {
            toast.error("Deletion failed.");
        }
    };

    useEffect(() => { fetchTasks(); }, [leadId, customerId, dealId]);
    useEffect(() => setPage(1), [tasks.length]);

    const size = Math.max(1, Number(pageSize) || PAGE_SIZE);
    const totalPages = Math.ceil(tasks.length / size) || 1;
    const paginatedTasks = tasks.slice((page - 1) * size, page * size);

    const getPriorityColor = (p) => {
        if (p === "High") return "text-red-500 bg-red-50 border-red-100";
        if (p === "Medium") return "text-amber-500 bg-amber-50 border-amber-100";
        return "text-blue-500 bg-blue-50 border-blue-100";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                    <FiCheckCircle className="text-green-500" />
                    Pending Tasks & Reminders
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-100 transition-all border border-green-100"
                >
                    <FiPlus /> {showForm ? "Cancel" : "Add Task"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleAddTask} className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 shadow-inner space-y-5 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Task Title *</label>
                            <input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="What needs to be done?"
                                className="w-full px-5 py-4 bg-white rounded-2xl border border-transparent outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 font-bold text-sm text-gray-700 shadow-sm transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Due Date</label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-5 py-4 bg-white rounded-2xl border border-transparent outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 font-bold text-sm text-gray-700 shadow-sm transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority</label>
                        <div className="flex gap-3">
                            {["Low", "Medium", "High"].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: p })}
                                    className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.priority === p ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4.5 bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                        Create Task Reminder
                    </button>
                </form>
            )}

            <div className="space-y-3">
                {paginatedTasks.length > 0 ? paginatedTasks.map((task) => {
                    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "Completed";
                    return (
                        <div key={task._id} className={`group flex items-center justify-between p-5 bg-white rounded-2xl border transition-all hover:shadow-md ${task.status === "Completed" ? "opacity-60 border-gray-50" : "border-gray-100 shadow-sm"}`}>
                            <div className="flex items-center gap-5">
                                <button
                                    onClick={() => toggleStatus(task)}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${task.status === "Completed" ? "bg-green-500 border-green-500 text-white" : "border-gray-200 bg-gray-50 hover:border-green-500 group-hover:bg-white"}`}
                                >
                                    {task.status === "Completed" && <FiCheckCircle size={16} />}
                                </button>
                                <div>
                                    <h4 className={`text-sm font-black tracking-tight ${task.status === "Completed" ? "line-through text-gray-400" : "text-gray-800"}`}>
                                        {task.title}
                                    </h4>
                                    <div className="flex items-center gap-4 mt-1.5">
                                        <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getPriorityColor(task.priority)}`}>
                                            <FiAlertCircle size={10} /> {task.priority}
                                        </div>
                                        <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isOverdue ? "text-red-500 animate-pulse" : "text-gray-400"}`}>
                                            <FiCalendar size={11} /> {new Date(task.dueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => deleteTask(task._id)}
                                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                            >
                                <FiTrash2 size={16} />
                            </button>
                        </div>
                    );
                }) : !loading && (
                    <div className="p-16 text-center bg-gray-50/30 rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
                        <FiClock className="text-gray-200 mb-4" size={40} />
                        <p className="text-gray-300 font-black uppercase tracking-[0.3em] text-[10px]">No active tasks or reminders.</p>
                    </div>
                )}
            </div>
            {totalPages > 1 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    total={tasks.length}
                    pageSize={size}
                />
            )}
        </div>
    );
};

export default TasksSection;

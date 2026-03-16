import React, { useState, useEffect } from "react";
import API from "../services/api";
import { FiPlus, FiCheckCircle, FiClock, FiAlertCircle, FiTrash2, FiCalendar, FiUser } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import Pagination from "./Pagination";

const ACTIVITY_TYPES = [
    "To-Do",
    "Email",
    "Call",
    "Meeting",
    "Follow-up Quote",
    "Make Quote",
    "Call for Demo",
    "Email: Welcome Demo",
];

const PAGE_SIZE = 10;
const TasksSection = ({ leadId, customerId, dealId, pageSize = PAGE_SIZE }) => {
    const toast = useToast();
    const [tasks, setTasks] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        activityType: "To-Do",
        summary: "",
        dueDate: "",
        assignedTo: "",
        priority: "Medium",
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

    const fetchUsers = async () => {
        try {
            const res = await API.get("/users");
            const raw = res.data?.data ?? res.data;
            setUsers(Array.isArray(raw) ? raw : []);
        } catch (err) {
            console.error("Users fetch error:", err);
        }
    };

    const getDefaultDueDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const h = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        return `${y}-${m}-${day}T${h}:${min}`;
    };

    const resetForm = () => {
        setFormData({
            activityType: "To-Do",
            summary: "",
            dueDate: getDefaultDueDate(),
            assignedTo: "",
            priority: "Medium",
        });
    };

    const buildPayload = (status = "Pending") => {
        const title = formData.summary?.trim() || `${formData.activityType} - Scheduled`;
        return {
            title,
            activityType: formData.activityType,
            description: formData.summary?.trim() || "",
            dueDate: formData.dueDate || undefined,
            assignedTo: formData.assignedTo || undefined,
            priority: formData.priority,
            status,
            leadId: leadId || undefined,
            customerId: customerId || undefined,
            dealId: dealId || undefined,
        };
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            await API.post("/crm/todos", buildPayload("Pending"));
            toast.success("Activity scheduled.");
            resetForm();
            setShowModal(false);
            fetchTasks();
        } catch (err) {
            toast.error("Failed to schedule activity.");
        }
    };

    const handleScheduleAndMarkDone = async (e) => {
        e.preventDefault();
        try {
            await API.post("/crm/todos", buildPayload("Completed"));
            toast.success("Activity scheduled and marked done.");
            resetForm();
            setShowModal(false);
            fetchTasks();
        } catch (err) {
            toast.error("Failed to schedule activity.");
        }
    };

    const handleDoneAndScheduleNext = async (e) => {
        e.preventDefault();
        try {
            await API.post("/crm/todos", buildPayload("Completed"));
            toast.success("Activity added. Add another below.");
            resetForm();
            fetchTasks();
        } catch (err) {
            toast.error("Failed to add activity.");
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
    useEffect(() => {
        if (showModal) fetchUsers();
    }, [showModal]);

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
                    type="button"
                    onClick={() => { setShowModal(true); resetForm(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-indigo-100 transition-all border border-indigo-100"
                >
                    <FiPlus size={16} /> Schedule Activity
                </button>
            </div>

            {/* Schedule Activity — inline form (no popup) */}
            {showModal && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
                    <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Schedule Activity</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-600">Activity Type</label>
                            <select
                                value={formData.activityType}
                                onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white rounded-lg border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            >
                                {ACTIVITY_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-600">Due Date</label>
                            <input
                                type="datetime-local"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white rounded-lg border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-600">Summary</label>
                        <input
                            type="text"
                            placeholder="Log a note..."
                            value={formData.summary}
                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white rounded-lg border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-600">Assigned to</label>
                        <select
                            value={formData.assignedTo}
                            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white rounded-lg border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        >
                            <option value="">Current user (default)</option>
                            {users.map((u) => (
                                <option key={u._id} value={u._id}>{u.name} {u.email ? `(${u.email})` : ""}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-600">Priority</label>
                        <div className="flex gap-2">
                            {["Low", "Medium", "High"].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: p })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border ${formData.priority === p ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                        <button type="button" onClick={handleSchedule} className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
                            Schedule
                        </button>
                        <button type="button" onClick={handleScheduleAndMarkDone} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
                            Schedule & Mark as Done
                        </button>
                        <button type="button" onClick={handleDoneAndScheduleNext} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
                            Done & Schedule Next
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {paginatedTasks.length > 0 ? paginatedTasks.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Completed";
                    const displayTitle = task.title || (task.activityType ? `${task.activityType}${task.description ? `: ${task.description}` : ""}` : "Task");
                    return (
                        <div key={task._id} className={`group flex items-center justify-between p-5 bg-white rounded-2xl border transition-all hover:shadow-md ${task.status === "Completed" ? "opacity-60 border-gray-50" : "border-gray-100 shadow-sm"}`}>
                            <div className="flex items-center gap-5">
                                <button
                                    type="button"
                                    onClick={() => toggleStatus(task)}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${task.status === "Completed" ? "bg-green-500 border-green-500 text-white" : "border-gray-200 bg-gray-50 hover:border-green-500 group-hover:bg-white"}`}
                                >
                                    {task.status === "Completed" && <FiCheckCircle size={16} />}
                                </button>
                                <div className="min-w-0">
                                    <h4 className={`text-sm font-black tracking-tight ${task.status === "Completed" ? "line-through text-gray-400" : "text-gray-800"}`}>
                                        {displayTitle}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                        {task.activityType && (
                                            <span className="text-[9px] font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                                                {task.activityType}
                                            </span>
                                        )}
                                        <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getPriorityColor(task.priority)}`}>
                                            <FiAlertCircle size={10} /> {task.priority}
                                        </div>
                                        {task.dueDate && (
                                            <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isOverdue ? "text-red-500 animate-pulse" : "text-gray-400"}`}>
                                                <FiCalendar size={11} /> {new Date(task.dueDate).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                                            </div>
                                        )}
                                        {task.assignedTo?.name && (
                                            <div className="flex items-center gap-1 text-[9px] text-gray-500">
                                                <FiUser size={10} /> {task.assignedTo.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => deleteTask(task._id)}
                                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90 shrink-0"
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

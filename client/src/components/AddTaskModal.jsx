import React, { useState, useEffect } from "react";
import API from "../services/api";
import { FiX, FiCheckCircle, FiCalendar, FiAlertCircle } from "react-icons/fi";
import { useToast } from "../context/ToastContext";

const AddTaskModal = ({ isOpen, onClose, onSuccess, lead, deal, customer }) => {
    const toast = useToast();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        dueDate: "",
        priority: "Medium",
        leadId: "",
        dealId: "",
        customerId: "",
        description: ""
    });

    const fetchLeads = async () => {
        try {
            const res = await API.get("/leads");
            setLeads(res.data?.data || []);
        } catch (err) {
            console.error("Leads fetch error:", err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLeads();
            setFormData({
                title: "",
                dueDate: "",
                priority: "Medium",
                leadId: lead?._id || "",
                dealId: deal?._id || "",
                customerId: customer?._id || "",
                description: ""
            });
        }
    }, [isOpen, lead, deal, customer]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post("/crm/todos", formData);
            toast.success("Task created successfully!");
            onSuccess();
            onClose();
        } catch (err) {
            toast.error("Failed to create task.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">

                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Create New Task</h2>
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Schedule your next action.</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm group">
                        <FiX size={20} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Task Title *</label>
                        <input
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="What needs to be done?"
                            className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-500 font-bold text-sm text-gray-700 transition-all shadow-inner"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Due Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Due Date & Time *</label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-500 font-bold text-sm text-gray-700 transition-all shadow-inner"
                            />
                        </div>

                        {/* Related Lead */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Relate to Lead</label>
                            <select
                                value={formData.leadId}
                                onChange={e => setFormData({ ...formData, leadId: e.target.value })}
                                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-500 font-bold text-sm text-gray-700 appearance-none transition-all shadow-inner"
                            >
                                <option value="">Independent Task</option>
                                {leads.map(lead => (
                                    <option key={lead._id} value={lead._id}>{lead.name} ({lead.companyName})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority</label>
                        <div className="flex gap-3">
                            {["Low", "Medium", "High"].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: p })}
                                    className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.priority === p ? 'bg-teal-700 text-white border-teal-700 shadow-lg shadow-teal-600/20' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50 mt-4 shadow-xl shadow-gray-200"
                    >
                        {loading ? "Creating..." : "Schedule Task Reminder"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddTaskModal;

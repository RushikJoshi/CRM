import React, { useState, useEffect } from "react";
import API from "../services/api";
import { FiX, FiCheckCircle, FiCalendar, FiAlertCircle } from "react-icons/fi";
import { useToast } from "../context/ToastContext";

const AddTaskModal = ({ isOpen, onClose, onSuccess, lead, deal, customer, isStandalone = false }) => {
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
        if (isOpen || isStandalone) {
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
    }, [isOpen, isStandalone, lead, deal, customer]);

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

    if (!isOpen && !isStandalone) return null;

    const content = (
        <div className={`bg-white w-full ${isStandalone ? "" : "max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 border border-gray-100"} overflow-hidden animate-in zoom-in-95 duration-300`}>
            {/* Header */}
            <div className={`p-4 border-b border-gray-50 flex items-center justify-between ${isStandalone ? "bg-white" : "bg-gray-50/50"}`}>
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight text-left leading-none">Create New Task</h2>
                    <p className="text-gray-400 font-bold text-[9px] uppercase tracking-widest mt-1 text-left">Schedule your next action.</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-all shadow-sm group">
                    <FiX size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-left">
                {/* Title */}
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Task Title *</label>
                    <input
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="What needs to be done?"
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-500 font-bold text-xs text-gray-700 transition-all shadow-inner"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Due Date */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Due Date & Time *</label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.dueDate}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-500 font-bold text-xs text-gray-700 transition-all shadow-inner"
                        />
                    </div>

                    {/* Related Lead */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Relate to Lead</label>
                        <select
                            value={formData.leadId}
                            onChange={e => setFormData({ ...formData, leadId: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-500 font-bold text-xs text-gray-700 appearance-none transition-all shadow-inner"
                        >
                            <option value="">Independent Task</option>
                            {leads.map(lead => (
                                <option key={lead._id} value={lead._id}>{lead.name} ({lead.companyName})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority</label>
                    <div className="flex gap-2">
                        {["Low", "Medium", "High"].map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setFormData({ ...formData, priority: p })}
                                className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${formData.priority === p ? 'bg-teal-700 text-white border-teal-700 shadow-lg shadow-teal-600/20' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
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
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-black active:scale-95 disabled:opacity-50 mt-2 shadow-lg shadow-gray-200"
                >
                    {loading ? "Creating..." : "Schedule Task Reminder"}
                </button>
            </form>
        </div>
    );

    if (isStandalone) return content;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            {content}
        </div>
    );
};

export default AddTaskModal;

import React, { useState, useEffect } from "react";
import { FiX, FiUser, FiMail, FiPhone, FiPlus, FiGlobe, FiMessageSquare, FiBriefcase, FiCheck } from "react-icons/fi";
import API from "../services/api";

const AddInquiryModal = ({ isOpen, onClose, onSuccess, editingData = null, isStandalone = false }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        source: "manual",
        status: "new",
        message: ""
    });

    const SOURCES = [
        { value: "website", label: "Website" },
        { value: "whatsapp", label: "WhatsApp" },
        { value: "manual", label: "Manual" },
        { value: "ads", label: "Ads" }
    ];

    const STATUSES = [
        { value: "new", label: "New" },
        { value: "contacted", label: "Contacted" },
        { value: "qualified", label: "Qualified" },
        { value: "converted", label: "Converted" },
        { value: "rejected", label: "Rejected" }
    ];

    useEffect(() => {
        if (editingData) {
            setFormData({
                name: editingData.name || "",
                email: editingData.email || "",
                phone: editingData.phone || "",
                source: editingData.source || "manual",
                status: editingData.status || "new",
                message: editingData.message || ""
            });
        } else {
            setFormData({
                name: "",
                email: "",
                phone: "",
                source: "manual",
                status: "new",
                message: ""
            });
        }
    }, [editingData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (editingData) {
                await API.patch(`/inquiries/${editingData._id}`, formData);
            } else {
                await API.post("/inquiries", formData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save inquiry.");
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <div className={`bg-white w-full ${isStandalone ? "" : "max-w-2xl rounded-[2.5rem] shadow-2xl border border-gray-100"} overflow-hidden animate-in zoom-in-95 duration-300`}>
            {/* Header */}
            <div className={`p-4 border-b border-gray-50 flex items-center justify-between ${isStandalone ? "bg-white" : "bg-gray-50/50"}`}>
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight text-left leading-none">
                        {editingData ? "Edit Inquiry" : "New Intake Protocol"}
                    </h2>
                    <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mt-1 text-left">
                        {editingData ? "Refining inquiry parameters" : "Initializing new lead interaction"}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <FiX size={18} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-left">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest animate-shake">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Lead Identity *</label>
                        <div className="relative group">
                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors" size={14} />
                            <input
                                required
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Comm. Link *</label>
                        <div className="relative group">
                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors" size={14} />
                            <input
                                required
                                type="email"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                placeholder="email@example.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Direct Terminal *</label>
                        <div className="relative group">
                            <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors" size={14} />
                            <input
                                required
                                type="tel"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                placeholder="+1 (000) 000-0000"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Source */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Origin Vector</label>
                        <div className="relative group">
                            <select
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-400 focus:bg-white transition-all font-bold text-gray-700 text-xs appearance-none shadow-inner cursor-pointer"
                                value={formData.source}
                                onChange={e => setFormData({ ...formData, source: e.target.value })}
                            >
                                {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Engagement Status</label>
                        <div className="relative group">
                            <select
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-400 focus:bg-white transition-all font-bold text-gray-700 text-xs appearance-none shadow-inner cursor-pointer"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Intelligence Packet</label>
                    <div className="relative group">
                        <FiMessageSquare className="absolute left-4 top-3 text-gray-400 group-focus-within:text-teal-600 transition-colors" size={14} />
                        <textarea
                            rows={3}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner resize-none"
                            placeholder="Intake details..."
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3.5 bg-gray-100 text-gray-500 font-black rounded-xl hover:bg-gray-200 transition-all text-[10px] uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-teal-600 text-white font-black rounded-xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all text-[10px] uppercase tracking-widest disabled:opacity-70"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <FiCheck size={16} />
                                {editingData ? "Update Record" : "Confirm Intake"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );

    if (isStandalone) return content;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            {content}
        </div>
    );
};

export default AddInquiryModal;

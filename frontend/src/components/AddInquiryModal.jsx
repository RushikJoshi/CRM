import React, { useState } from "react";
import { FiX, FiUser, FiMail, FiPhone, FiPlus, FiGlobe, FiMessageSquare, FiBriefcase } from "react-icons/fi";
import API from "../services/api";

const AddInquiryModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        companyName: "",
        source: "Manual",
        website: "",
        message: ""
    });

    const SOURCES = [
        "Manual", "Phone Call", "Walk-in", "Email",
        "Referral", "Social Media", "Website", "Other"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await API.post("/inquiries", formData);
            onSuccess();
            onClose();
            setFormData({
                name: "",
                email: "",
                phone: "",
                companyName: "",
                source: "Manual",
                website: "",
                message: ""
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create inquiry.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-green-50 to-white flex items-center justify-between border-b border-gray-50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Register Inquiry</h2>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1">Manual Entry Protocol</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <FiX size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name *</label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    required
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Address *</label>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    required
                                    type="email"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Phone Number *</label>
                            <div className="relative group">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    required
                                    type="tel"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm"
                                    placeholder="+91 98765 43210"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Company Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Company Name</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm"
                                    placeholder="Company Ltd."
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Source */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Source Pipeline</label>
                            <div className="relative group text-sm font-bold text-gray-700">
                                <select
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all appearance-none cursor-pointer"
                                    value={formData.source}
                                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                                >
                                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs font-black">▼</div>
                            </div>
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Reference URL</label>
                            <div className="relative group">
                                <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm"
                                    placeholder="https://..."
                                    value={formData.website}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Requirement Notes</label>
                        <div className="relative group">
                            <FiMessageSquare className="absolute left-4 top-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                            <textarea
                                rows={3}
                                className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm resize-none"
                                placeholder="Additional requirements or context..."
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] flex items-center justify-center gap-3 px-8 py-4 bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FiPlus size={18} />
                                    Commit Inquiry
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddInquiryModal;

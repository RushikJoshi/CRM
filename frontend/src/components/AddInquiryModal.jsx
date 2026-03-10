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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl border border-[#E5EAF2] overflow-hidden animate-in zoom-in-95 duration-500 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                {/* Header */}
                <div className="px-10 py-8 bg-white flex items-center justify-between border-b border-[#F0F2F5] relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-600 text-white rounded-[20px] flex items-center justify-center shadow-xl shadow-blue-500/20 transform rotate-3">
                            <FiPlus size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-[#1A202C] tracking-tighter">
                                Add Inquiry
                            </h2>
                            <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.25em] mt-2 opacity-80">
                                INITIALIZING NEW INTAKE PROTOCOL NODE
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-[#A0AEC0] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100 shadow-sm hover:rotate-90">
                        <FiX size={24} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar relative z-10">
                    {error && (
                        <div className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-[24px] text-xs font-black uppercase tracking-widest animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Name */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Lead Identity</label>
                            <div className="relative group">
                                <FiUser size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    required
                                    type="text"
                                    className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]"
                                    placeholder="Enter full name..."
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Communication Link</label>
                            <div className="relative group">
                                <FiMail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    required
                                    type="email"
                                    className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Direct Terminal</label>
                            <div className="relative group">
                                <FiPhone size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    required
                                    type="tel"
                                    className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]"
                                    placeholder="+91"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Company Name */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Entity Context</label>
                            <div className="relative group">
                                <FiBriefcase size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="text"
                                    className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]"
                                    placeholder="Organization Name"
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Source */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Origin Vector</label>
                            <div className="relative group">
                                <select
                                    className="w-full px-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm appearance-none cursor-pointer"
                                    value={formData.source}
                                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                                >
                                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600 text-[10px] font-black tracking-widest uppercase">
                                    [ Select ]
                                </div>
                            </div>
                        </div>

                        {/* Website */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Global Web URI</label>
                            <div className="relative group">
                                <FiGlobe size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="text"
                                    className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]"
                                    placeholder="https://domain.com"
                                    value={formData.website}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Intelligence Packet</label>
                        <div className="relative group">
                            <FiMessageSquare size={20} className="absolute left-5 top-6 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                            <textarea
                                rows={4}
                                className="w-full pl-14 pr-6 py-5 bg-[#F4F7FB] border border-transparent rounded-[32px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm resize-none placeholder-[#CBD5E0]"
                                placeholder="Describe the intake context..."
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-6 pt-6 border-t border-[#F4F7FB]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-5 bg-[#F4F7FB] text-[#A0AEC0] font-black rounded-[24px] border border-[#E5EAF2] hover:bg-slate-100 hover:text-[#718096] transition-all text-[11px] uppercase tracking-[0.25em]"
                        >
                            Abort Intake
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] flex items-center justify-center gap-4 py-5 bg-blue-600 text-white font-black rounded-[24px] hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-blue-600/20 disabled:opacity-70 duration-300"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FiPlus size={20} strokeWidth={4} />
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

import React, { useState, useEffect } from "react";
import { FiX, FiUser, FiMail, FiPhone, FiPlus, FiGlobe, FiMessageSquare, FiBriefcase, FiFlag, FiTrendingUp, FiTarget } from "react-icons/fi";

const AddLeadModal = ({ isOpen, onClose, onSubmit, editingData }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        companyName: "",
        industry: "",
        status: "new",
        source: "Manual",
        value: 0,
        priority: "medium",
        notes: ""
    });

    useEffect(() => {
        if (editingData) {
            setFormData({
                name: editingData.name || "",
                email: editingData.email || "",
                phone: editingData.phone || "",
                companyName: editingData.companyName || "",
                industry: editingData.industry || "",
                status: editingData.status || "new",
                source: editingData.source || "Manual",
                value: editingData.value || 0,
                priority: editingData.priority || "medium",
                notes: editingData.notes || ""
            });
        } else {
            setFormData({
                name: "",
                email: "",
                phone: "",
                companyName: "",
                industry: "",
                status: "new",
                source: "Manual",
                value: 0,
                priority: "medium",
                notes: ""
            });
        }
    }, [editingData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
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
                            <FiTarget size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-[#1A202C] tracking-tighter">
                                {editingData ? "Refine Lead" : "Architect Lead"}
                            </h2>
                            <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.25em] mt-2 opacity-80">
                                {editingData ? "Synchronizing updated prospect telemetry" : "Initializing new prospect node in pipeline"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-[#A0AEC0] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100 shadow-sm hover:rotate-90">
                        <FiX size={24} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Name */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Identification Node</label>
                            <div className="relative group">
                                <FiUser size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    required
                                    name="name"
                                    type="text"
                                    className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]"
                                    placeholder="Full Legal Name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Communication Link</label>
                            <div className="relative group">
                                <FiMail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    name="email"
                                    type="email"
                                    className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]"
                                    placeholder="contact@domain.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Direct Terminal</label>
                            <div className="relative group">
                                <FiPhone size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    name="phone"
                                    type="tel"
                                    className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]"
                                    placeholder="+91"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Company */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Entity Context</label>
                            <div className="relative group">
                                <FiBriefcase size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    name="companyName"
                                    type="text"
                                    className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]"
                                    placeholder="Organization Name"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Phase State</label>
                            <div className="relative group">
                                <FiFlag size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors z-10" />
                                <select
                                    name="status"
                                    className="w-full pl-14 pr-12 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm appearance-none cursor-pointer"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="new">New Record</option>
                                    <option value="contacted">Validated / Contacted</option>
                                    <option value="qualified">Qualified Node</option>
                                    <option value="proposal">Blueprint Proposal</option>
                                    <option value="closed">Archive / Closed</option>
                                </select>
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Urgency Level</label>
                            <div className="relative group">
                                <FiTarget size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors z-10" />
                                <select
                                    name="priority"
                                    className="w-full pl-14 pr-12 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm appearance-none cursor-pointer"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    <option value="low">Standard Priority</option>
                                    <option value="medium">Elevated Priority</option>
                                    <option value="high">Critical / Velocity</option>
                                </select>
                            </div>
                        </div>

                        {/* Value */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Revenue Potential (₹)</label>
                            <div className="relative group">
                                <FiTrendingUp size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    name="value"
                                    type="number"
                                    className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]"
                                    placeholder="0.00"
                                    value={formData.value}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Source */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Origin Vector</label>
                            <div className="relative group">
                                <FiGlobe size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#Clean5E0] group-focus-within:text-blue-600 transition-colors z-10" />
                                <select
                                    name="source"
                                    className="w-full pl-14 pr-12 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm appearance-none cursor-pointer"
                                    value={formData.source}
                                    onChange={handleChange}
                                >
                                    <option value="Manual">Internal Manual</option>
                                    <option value="Website">Global Web</option>
                                    <option value="Referral">Persona Referral</option>
                                    <option value="Social Media">Social Vector</option>
                                    <option value="Partner">Strategic Partner</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Intelligence Brief</label>
                        <div className="relative group">
                            <FiMessageSquare size={20} className="absolute left-5 top-6 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                            <textarea
                                name="notes"
                                rows={4}
                                className="w-full pl-14 pr-6 py-5 bg-[#F4F7FB] border border-transparent rounded-[32px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm resize-none placeholder-[#CBD5E0]"
                                placeholder="Append supplemental leads intelligence..."
                                value={formData.notes}
                                onChange={handleChange}
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
                            Abort Sync
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] flex items-center justify-center gap-4 py-5 bg-blue-600 text-white font-black rounded-[24px] hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-blue-600/20 duration-300"
                        >
                            <FiPlus size={20} strokeWidth={4} />
                            {editingData ? "Commit Updates" : "Broadcast Node"}
                        </button>
                    </div>
                </form>
            </div>
        </div>

    );
};

export default AddLeadModal;

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-green-50 to-white flex items-center justify-between border-b border-gray-50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                            {editingData ? "Refine Lead Profile" : "Initialize Lead Record"}
                        </h2>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1">
                            {editingData ? "Market Asset Modernization" : "Strategic Acquisition Entry"}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <FiX size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Prospect Identity *</label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    required
                                    name="name"
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm"
                                    placeholder="Enter full name..."
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Communication Terminal (Email)</label>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    name="email"
                                    type="email"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm"
                                    placeholder="prospect@network.io"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Direct Dial Access</label>
                            <div className="relative group">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    name="phone"
                                    type="tel"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm"
                                    placeholder="+00 (000) 000-0000"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Company */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Organizational Entity</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    name="companyName"
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm"
                                    placeholder="Entity Name Ltd."
                                    value={formData.companyName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Pipeline Phase</label>
                            <div className="relative group">
                                <FiFlag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors z-10" />
                                <select
                                    name="status"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm appearance-none cursor-pointer"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="new">New Inbound</option>
                                    <option value="contacted">Phase: Contacted</option>
                                    <option value="qualified">Phase: Qualified</option>
                                    <option value="proposal">Phase: Proposal</option>
                                    <option value="closed">Phase: Archive/Closed</option>
                                </select>
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Impact Priority</label>
                            <div className="relative group">
                                <FiTarget className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors z-10" />
                                <select
                                    name="priority"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm appearance-none cursor-pointer"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    <option value="low">Low Impact</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">Critical / High</option>
                                </select>
                            </div>
                        </div>

                        {/* Value */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Estimated Asset Value (₹)</label>
                            <div className="relative group">
                                <FiTrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    name="value"
                                    type="number"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm"
                                    placeholder="0.00"
                                    value={formData.value}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Source */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Acquisition Source</label>
                            <div className="relative group">
                                <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors z-10" />
                                <select
                                    name="source"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm appearance-none cursor-pointer"
                                    value={formData.source}
                                    onChange={handleChange}
                                >
                                    <option value="Manual">Manual Entry</option>
                                    <option value="Website">Global Website</option>
                                    <option value="Referral">Network Referral</option>
                                    <option value="Social Media">Social Intelligence</option>
                                    <option value="Partner">Business Partner</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Intelligence Notes</label>
                        <div className="relative group">
                            <FiMessageSquare className="absolute left-4 top-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                            <textarea
                                name="notes"
                                rows={3}
                                className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm resize-none"
                                placeholder="Additional intelligence data or contextual observations..."
                                value={formData.notes}
                                onChange={handleChange}
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
                            className="flex-[2] flex items-center justify-center gap-3 px-8 py-4 bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest"
                        >
                            <FiPlus size={18} />
                            {editingData ? "Update Intelligence" : "Commit Record"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLeadModal;

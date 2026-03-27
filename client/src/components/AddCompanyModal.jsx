import React, { useState, useEffect } from "react";
import { FiX, FiBriefcase, FiMail, FiPhone, FiGlobe, FiInfo, FiPlus, FiLock, FiUser, FiMapPin, FiActivity, FiShield, FiCheck } from "react-icons/fi";

const AddCompanyModal = ({ isOpen, onClose, onSubmit, editingData, isStandalone = false }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        website: "",
        industry: "",
        address: "",
        adminName: "",
        adminEmail: "",
        adminPassword: "",
        status: "active"
    });

    useEffect(() => {
        if (editingData) {
            setFormData({
                name: editingData.name || "",
                email: editingData.email || "",
                phone: editingData.phone || "",
                website: editingData.website || "",
                industry: editingData.industry || "",
                address: editingData.address || "",
                status: editingData.status || "active",
                adminName: "",
                adminEmail: "",
                adminPassword: ""
            });
        } else {
            setFormData({
                name: "",
                email: "",
                phone: "",
                website: "",
                industry: "",
                address: "",
                adminName: "",
                adminEmail: "",
                adminPassword: "",
                status: "active"
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

    const content = (
        <div className={`bg-white w-full ${isStandalone ? "" : "max-w-2xl rounded-[2.5rem] shadow-2xl border border-gray-100"} overflow-hidden animate-in zoom-in-95 duration-300`}>
            {/* Header */}
            <div className={`p-4 border-b border-gray-50 flex items-center justify-between ${isStandalone ? "bg-white" : "bg-gray-50/50"}`}>
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight text-left leading-none">
                        {editingData ? "Edit Company" : "Add New Company"}
                    </h2>
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1 text-left">
                        {editingData ? "Update company metadata and settings" : "Establish a new enterprise partner"}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <FiX size={18} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Info */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Company Name *</label>
                        <div className="relative group">
                            <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                            <input
                                required
                                name="name"
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                placeholder="Company Name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Industry/Domain</label>
                        <div className="relative group">
                            <FiActivity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                            <input
                                name="industry"
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                placeholder="Technology, Real Estate, etc."
                                value={formData.industry}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Official Website</label>
                        <div className="relative group">
                            <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                            <input
                                name="website"
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                placeholder="https://example.com"
                                value={formData.website}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Contact Email *</label>
                        <div className="relative group">
                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                            <input
                                required
                                name="email"
                                type="email"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                placeholder="corp@example.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Contact Phone</label>
                        <div className="relative group">
                            <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                            <input
                                name="phone"
                                type="tel"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                placeholder="+1 (000) 000-0000"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Status</label>
                        <div className="relative group">
                            <FiCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors z-10" size={14} />
                            <select
                                name="status"
                                className="w-full pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs appearance-none shadow-inner cursor-pointer"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Account Provisioning */}
                {!editingData && (
                    <div className="pt-4 border-t border-gray-50 space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <FiShield size={12} /> Admin Provisioning
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Admin Name *</label>
                                <div className="relative group">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                                    <input
                                        required={!editingData}
                                        name="adminName"
                                        type="text"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                        placeholder="Admin Full Name"
                                        value={formData.adminName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Admin Login Email *</label>
                                <div className="relative group">
                                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                                    <input
                                        required={!editingData}
                                        name="adminEmail"
                                        type="email"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                        placeholder="admin@company.com"
                                        value={formData.adminEmail || formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Admin Password *</label>
                                <div className="relative group">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                                    <input
                                        required={!editingData}
                                        name="adminPassword"
                                        type="password"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                        placeholder="••••••••"
                                        value={formData.adminPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                        className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                    >
                        <FiCheck size={16} />
                        {editingData ? "Update Company" : "Confirm Onboarding"}
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

export default AddCompanyModal;

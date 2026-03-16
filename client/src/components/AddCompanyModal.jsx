import React, { useState, useEffect } from "react";
import { FiX, FiBriefcase, FiMail, FiPhone, FiGlobe, FiInfo, FiPlus, FiLock, FiUser, FiMapPin, FiActivity, FiShield } from "react-icons/fi";

const AddCompanyModal = ({ isOpen, onClose, onSubmit, editingData }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        website: "",
        industry: "",
        address: "",
        // Admin details (only for new creation)
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-10 py-8 bg-gradient-to-r from-green-50 to-white flex items-center justify-between border-b border-gray-50">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                            {editingData ? "Edit Company" : "Add Company"}
                        </h2>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1">
                            {editingData ? "Update company details" : "Create a new company"}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <FiX size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* Primary Metadata */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-gray-300 font-black uppercase tracking-[0.3em] text-[10px]">
                            <FiActivity /> Basic Info
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Company Name *</label>
                                <div className="relative group">
                                    <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                    <input
                                        required
                                        name="name"
                                        type="text"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                                        placeholder="Globex Corporation"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Website *</label>
                                <div className="relative group">
                                    <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                    <input
                                        required
                                        name="website"
                                        type="text"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                                        placeholder="https://globex.io"
                                        value={formData.website}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email *</label>
                                <div className="relative group">
                                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                    <input
                                        required
                                        name="email"
                                        type="email"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                                        placeholder="corp@globex.io"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Phone</label>
                                <div className="relative group">
                                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                    <input
                                        name="phone"
                                        type="tel"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                                        placeholder="+1 (800) GLOBEX"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Address</label>
                            <div className="relative group">
                                <FiMapPin className="absolute left-4 top-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <textarea
                                    name="address"
                                    rows={2}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm resize-none"
                                    placeholder="San Francisco HQ Node..."
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Admin Provisioning (New Only) */}
                    {!editingData && (
                        <div className="space-y-6 pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-3 text-gray-300 font-black uppercase tracking-[0.3em] text-[10px]">
                                <FiShield /> Admin Account
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Admin Name *</label>
                                    <div className="relative group">
                                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                        <input
                                            required
                                            name="adminName"
                                            type="text"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                                            placeholder="Admin Name"
                                            value={formData.adminName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Admin Password *</label>
                                    <div className="relative group">
                                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                        <input
                                            required
                                            name="adminPassword"
                                            type="password"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                                            placeholder="Admin Password"
                                            value={formData.adminPassword}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 bg-orange-50/50 rounded-[1.5rem] border border-orange-100 flex items-start gap-3">
                                <FiInfo className="text-orange-400 mt-1 shrink-0" />
                                <p className="text-[10px] font-bold text-orange-600 leading-relaxed uppercase tracking-widest">
                                    Note: This user will be the main administrator for this company.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-8 py-5 bg-gray-100 text-gray-500 font-black rounded-3xl hover:bg-gray-200 transition-all text-[11px] uppercase tracking-[0.2em]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] flex items-center justify-center gap-3 px-8 py-5 bg-green-600 text-white font-black rounded-3xl shadow-2xl shadow-green-500/30 hover:bg-green-700 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em]"
                        >
                            <FiPlus size={20} />
                            {editingData ? "Save Changes" : "Create Company"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCompanyModal;

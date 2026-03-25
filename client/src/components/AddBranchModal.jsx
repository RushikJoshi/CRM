import React, { useState, useEffect } from "react";
import { FiX, FiLayers, FiMapPin, FiBriefcase, FiInfo, FiPlus, FiPhone, FiActivity, FiCheck } from "react-icons/fi";
import API from "../services/api";

const AddBranchModal = ({ isOpen, onClose, onSubmit, editingData, isStandalone = false }) => {
    const [companies, setCompanies] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        companyId: "",
        status: "active"
    });

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isSuperAdmin = user.role === "super_admin";

    useEffect(() => {
        if (isOpen && isSuperAdmin) {
            fetchCompanies();
        }
    }, [isOpen]);

    useEffect(() => {
        if (editingData) {
            setFormData({
                name: editingData.name || "",
                address: editingData.address || "",
                phone: editingData.phone || "",
                companyId: editingData.companyId?._id || editingData.companyId || "",
                status: editingData.status || "active"
            });
        } else {
            setFormData({
                name: "",
                address: "",
                phone: "",
                companyId: isSuperAdmin ? "" : user.companyId,
                status: "active"
            });
        }
    }, [editingData, isOpen]);

    const fetchCompanies = async () => {
        try {
            const res = await API.get("/super-admin/companies");
            setCompanies(res.data.companies || []);
        } catch (err) {
            console.error(err);
        }
    };

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
                        {editingData ? "Edit Branch" : "Add Branch"}
                    </h2>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1 text-left">
                        {editingData ? "Update branch details" : "Create a new branch"}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <FiX size={18} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Branch Name */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Branch Name *</label>
                        <div className="relative group">
                            <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={14} />
                            <input
                                required
                                name="name"
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                placeholder="Branch Name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Company Selection (Super Admin only) */}
                    {isSuperAdmin && (
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Company *</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors z-10" size={14} />
                                <select
                                    required
                                    name="companyId"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 focus:bg-white transition-all font-bold text-gray-700 text-xs appearance-none shadow-inner cursor-pointer"
                                    value={formData.companyId}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Company...</option>
                                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Phone</label>
                        <div className="relative group">
                            <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={14} />
                            <input
                                name="phone"
                                type="tel"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Status</label>
                        <div className="relative group">
                            <FiActivity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors z-10" size={14} />
                            <select
                                name="status"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 focus:bg-white transition-all font-bold text-gray-700 text-xs appearance-none shadow-inner cursor-pointer"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Address</label>
                    <div className="relative group">
                        <FiMapPin className="absolute left-4 top-3 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={14} />
                        <textarea
                            name="address"
                            rows={2}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner resize-none"
                            placeholder="Branch Address..."
                            value={formData.address}
                            onChange={handleChange}
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
                        className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                    >
                        <FiCheck size={16} />
                        {editingData ? "Update Branch" : "Confirm Branch"}
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

export default AddBranchModal;

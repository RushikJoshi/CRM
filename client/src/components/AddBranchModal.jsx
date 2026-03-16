import React, { useState, useEffect } from "react";
import { FiX, FiLayers, FiMapPin, FiBriefcase, FiInfo, FiPlus, FiPhone, FiActivity, FiSearch } from "react-icons/fi";
import API from "../services/api";

const AddBranchModal = ({ isOpen, onClose, onSubmit, editingData }) => {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-10 py-8 bg-gradient-to-r from-green-50 to-white flex items-center justify-between border-b border-gray-50">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                            {editingData ? "Edit Branch" : "Add Branch"}
                        </h2>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1">
                            {editingData ? "Update branch details" : "Create a new branch"}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <FiX size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-gray-300 font-black uppercase tracking-[0.3em] text-[10px]">
                            <FiActivity /> Branch Information
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Branch Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Branch Name *</label>
                                <div className="relative group">
                                    <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                    <input
                                        required
                                        name="name"
                                        type="text"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                                        placeholder="Branch Name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Company Selection (Super Admin only) */}
                            {isSuperAdmin && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Company *</label>
                                    <div className="relative group">
                                        <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors z-10" />
                                        <select
                                            required
                                            name="companyId"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm appearance-none shadow-sm cursor-pointer"
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
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Phone</label>
                                <div className="relative group">
                                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                    <input
                                        name="phone"
                                        type="tel"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                                        placeholder="Phone Number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Status</label>
                                <div className="relative group">
                                    <FiActivity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors z-10" />
                                    <select
                                        name="status"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm appearance-none shadow-sm cursor-pointer"
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
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Address</label>
                            <div className="relative group">
                                <FiMapPin className="absolute left-4 top-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <textarea
                                    name="address"
                                    rows={2}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm resize-none"
                                    placeholder="Branch Address..."
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-green-50/50 rounded-[2rem] border border-green-100/50 flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <FiInfo className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-green-700 uppercase tracking-[0.2em]">Note</p>
                            <p className="text-[10px] font-bold text-gray-500 mt-1 leading-relaxed">
                                Creating this branch will allow you to assign users to it.
                            </p>
                        </div>
                    </div>

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
                            {editingData ? "Save Changes" : "Save Branch"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddBranchModal;

import React, { useState, useEffect } from "react";
import { FiX, FiUser, FiMail, FiLock, FiShield, FiBriefcase, FiLayers, FiInfo, FiPlus, FiCheck } from "react-icons/fi";
import API from "../services/api";

const AddUserModal = ({ isOpen, onClose, onSubmit, editingData, isStandalone = false }) => {
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "sales",
        companyId: "",
        branchId: "",
        status: "active"
    });

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isSuperAdmin = user.role === "super_admin";
    const isCompanyAdmin = user.role === "company_admin";

    useEffect(() => {
        if (isOpen && isSuperAdmin) {
            fetchCompanies();
        }
    }, [isOpen]);

    useEffect(() => {
        if (formData.companyId) {
            fetchBranches(formData.companyId);
        } else {
            setBranches([]);
        }
    }, [formData.companyId]);

    useEffect(() => {
        if (editingData) {
            setFormData({
                name: editingData.name || "",
                email: editingData.email || "",
                password: "",
                role: editingData.role || "sales",
                companyId: editingData.companyId?._id || editingData.companyId || "",
                branchId: editingData.branchId?._id || editingData.branchId || "",
                status: editingData.status || "active"
            });
        } else {
            setFormData({
                name: "",
                email: "",
                password: "",
                role: isCompanyAdmin ? "sales" : "company_admin",
                companyId: isCompanyAdmin ? user.companyId : "",
                branchId: "",
                status: "active"
            });
        }
    }, [editingData, isOpen]);

    const fetchCompanies = async () => {
        try {
            const res = await API.get("/super-admin/companies");
            setCompanies(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBranches = async (cId) => {
        try {
            const apiBase = isSuperAdmin ? "/super-admin/branches" : "/branches";
            const res = await API.get(`${apiBase}?companyId=${cId}`);
            setBranches(res.data.data || []);
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
        const submissionData = { ...formData };
        if (editingData && !submissionData.password) {
            delete submissionData.password;
        }
        onSubmit(submissionData);
    };

    const content = (
        <div className={`bg-white w-full ${isStandalone ? "" : "max-w-2xl rounded-[2.5rem] shadow-2xl border border-gray-100"} overflow-hidden animate-in zoom-in-95 duration-300`}>
            {/* Header */}
            <div className={`p-4 border-b border-gray-50 flex items-center justify-between ${isStandalone ? "bg-white" : "bg-gray-50/50"}`}>
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight text-left leading-none">
                        {editingData ? "Edit User" : "Add New User"}
                    </h2>
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1 text-left">
                        {editingData ? "Update user credentials and access" : "Establish a new user identity"}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <FiX size={18} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name *</label>
                        <div className="relative group">
                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                            <input
                                required
                                name="name"
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Email Address *</label>
                        <div className="relative group">
                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                            <input
                                required
                                name="email"
                                type="email"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">
                            {editingData ? "New Password (Optional)" : "Security Password *"}
                        </label>
                        <div className="relative group">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                            <input
                                required={!editingData}
                                name="password"
                                type="password"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs shadow-inner"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Access Role *</label>
                        <div className="relative group">
                            <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors z-10" size={14} />
                            <select
                                name="role"
                                className="w-full pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs appearance-none shadow-inner cursor-pointer"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                                <option value="company_admin">Company Admin</option>
                                <option value="branch_manager">Branch Manager</option>
                                <option value="sales">Sales Executive</option>
                            </select>
                        </div>
                    </div>

                    {/* Company Selection (Super Admin only) */}
                    {isSuperAdmin && (
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Assign Company</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors z-10" size={14} />
                                <select
                                    name="companyId"
                                    className="w-full pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs appearance-none shadow-inner cursor-pointer"
                                    value={formData.companyId}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Company...</option>
                                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Branch Selection */}
                    {(formData.companyId || isCompanyAdmin) && (
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Assign Branch</label>
                            <div className="relative group">
                                <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors z-10" size={14} />
                                <select
                                    name="branchId"
                                    className="w-full pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-gray-700 text-xs appearance-none shadow-inner cursor-pointer"
                                    value={formData.branchId}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Branch...</option>
                                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
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
                        className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                    >
                        <FiCheck size={16} />
                        {editingData ? "Save Changes" : "Confirm User"}
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

export default AddUserModal;

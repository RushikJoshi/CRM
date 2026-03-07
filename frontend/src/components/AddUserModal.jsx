import React, { useState, useEffect } from "react";
import { FiX, FiUser, FiMail, FiLock, FiShield, FiBriefcase, FiLayers, FiInfo, FiPlus } from "react-icons/fi";
import API from "../services/api";

const AddUserModal = ({ isOpen, onClose, onSubmit, editingData }) => {
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
                password: "", // Don't show password for editing
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
            setCompanies(res.data.companies || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBranches = async (cId) => {
        try {
            const apiBase = isSuperAdmin ? "/super-admin/branches" : "/branches";
            const res = await API.get(`${apiBase}?companyId=${cId}`);
            setBranches(res.data || []);
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
        // If editing and password is empty, remove it from formData to avoid overwriting with empty
        const submissionData = { ...formData };
        if (editingData && !submissionData.password) {
            delete submissionData.password;
        }
        onSubmit(submissionData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-green-50 to-white flex items-center justify-between border-b border-gray-50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                            {editingData ? "Refine User Identity" : "Provision New Identity"}
                        </h2>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1">
                            {editingData ? "System Access Recalibration" : "Cross-Architecture Auth Provisioning"}
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
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Identity Name *</label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    required
                                    name="name"
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm"
                                    placeholder="e.g. Victor Prime"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Authentication Email *</label>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    required
                                    name="email"
                                    type="email"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm"
                                    placeholder="identity@crm-link.net"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                {editingData ? "Reset Password (Optional)" : "Primary Password *"}
                            </label>
                            <div className="relative group">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    required={!editingData}
                                    name="password"
                                    type="password"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Authority Clearance</label>
                            <div className="relative group">
                                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors z-10" />
                                <select
                                    name="role"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm appearance-none cursor-pointer"
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    {isSuperAdmin && <option value="super_admin">System: Super Admin</option>}
                                    <option value="company_admin">Platform: Company Admin</option>
                                    <option value="branch_manager">Regional: Branch Manager</option>
                                    <option value="sales">Operation: Sales Executive</option>
                                </select>
                            </div>
                        </div>

                        {/* Company Selection (Super Admin only) */}
                        {isSuperAdmin && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Parent Company Cluster</label>
                                <div className="relative group">
                                    <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors z-10" />
                                    <select
                                        name="companyId"
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm appearance-none cursor-pointer"
                                        value={formData.companyId}
                                        onChange={handleChange}
                                    >
                                        <option value="">Global / Internal</option>
                                        {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Branch Selection */}
                        {(formData.companyId || isCompanyAdmin) && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Operational Branch Node</label>
                                <div className="relative group">
                                    <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors z-10" />
                                    <select
                                        name="branchId"
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 text-sm appearance-none cursor-pointer"
                                        value={formData.branchId}
                                        onChange={handleChange}
                                    >
                                        <option value="">No Specific Node</option>
                                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Alert */}
                    <div className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <FiInfo className="text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-800 uppercase tracking-wider">Identity Activation Protocol</p>
                            <p className="text-[10px] font-bold text-gray-500 mt-1 leading-relaxed">
                                Upon initialization, the user will receive immediate authentication rights. Ensure identity verification is completed before committing to the secure cluster.
                            </p>
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
                            {editingData ? "Recalibrate Identity" : "Commit Provisioning"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;

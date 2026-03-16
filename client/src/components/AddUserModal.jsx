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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl border border-[#E5EAF2] overflow-hidden animate-in zoom-in-95 duration-500 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                {/* Header */}
                <div className="px-10 py-8 bg-white flex items-center justify-between border-b border-[#F0F2F5] relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-600 text-white rounded-[20px] flex items-center justify-center shadow-xl shadow-blue-500/20 transform rotate-3">
                            <FiShield size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-[#1A202C] tracking-tighter">
                                {editingData ? "Refine Identity" : "Onboard Identity"}
                            </h2>
                            <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.25em] mt-2 opacity-80">
                                {editingData ? "Synchronizing updated user credentials" : "Initializing new administrative access node"}
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
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Persona Name</label>
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
                                    required
                                    name="email"
                                    type="email"
                                    className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                {editingData ? "Secure Reset Vector" : "Security Lock Key"}
                            </label>
                            <div className="relative group">
                                <FiLock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    required={!editingData}
                                    name="password"
                                    type="password"
                                    className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Role */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Authorization Grade</label>
                            <div className="relative group">
                                <FiShield size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors z-10" />
                                <select
                                    name="role"
                                    className="w-full pl-14 pr-12 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm appearance-none cursor-pointer"
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    {isSuperAdmin && <option value="super_admin">Prime Admin</option>}
                                    <option value="company_admin">Entity Principal</option>
                                    <option value="branch_manager">Hub Architect</option>
                                    <option value="sales">Field Intelligence</option>
                                </select>
                            </div>
                        </div>

                        {/* Company Selection (Super Admin only) */}
                        {isSuperAdmin && (
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Entity Parent</label>
                                <div className="relative group">
                                    <FiBriefcase size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors z-10" />
                                    <select
                                        name="companyId"
                                        className="w-full pl-14 pr-12 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm appearance-none cursor-pointer"
                                        value={formData.companyId}
                                        onChange={handleChange}
                                    >
                                        <option value="">Detached Source</option>
                                        {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Branch Selection */}
                        {(formData.companyId || isCompanyAdmin) && (
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Operational Hub</label>
                                <div className="relative group">
                                    <FiLayers size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#Clean5E0] group-focus-within:text-blue-600 transition-colors z-10" />
                                    <select
                                        name="branchId"
                                        className="w-full pl-14 pr-12 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm appearance-none cursor-pointer"
                                        value={formData.branchId}
                                        onChange={handleChange}
                                    >
                                        <option value="">Neutral Branch</option>
                                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Alert */}
                    <div className="p-6 bg-blue-50/50 rounded-[32px] border border-blue-100 flex items-start gap-5">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100">
                            <FiInfo className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em]">System Propagation</p>
                            <p className="text-[12px] font-bold text-[#718096] mt-1 leading-relaxed">
                                Access parameters will propagate across the core cluster immediately upon sync completion.
                            </p>
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
                            {editingData ? "Commit Updates" : "Authorize Node"}
                        </button>
                    </div>
                </form>
            </div>
        </div>

    );
};

export default AddUserModal;

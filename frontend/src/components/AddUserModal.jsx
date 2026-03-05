import React, { useState, useEffect } from "react";
import { FiX, FiUser, FiMail, FiLock, FiShield, FiBriefcase, FiLayers } from "react-icons/fi";
import API from "../services/api";

const AddUserModal = ({ isOpen, onClose, onSubmit, editingData }) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role;
    const isSuperAdmin = role === "super_admin";
    const isCompanyAdmin = role === "company_admin";
    const isBranchManager = role === "branch_manager";

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: isBranchManager ? "sales" : "sales",
        companyId: isSuperAdmin ? "" : user.companyId?._id || user.companyId || "",
        branchId: isBranchManager ? user.branchId?._id || user.branchId || "" : "",
        status: "active"
    });

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        if (isOpen) {
            if (isSuperAdmin) fetchCompanies();
            else if (isCompanyAdmin || isBranchManager) {
                const cid = user.companyId?._id || user.companyId;
                if (cid) fetchBranches(cid);
            }

            if (editingData) {
                setFormData({
                    ...editingData,
                    password: "",
                    companyId: editingData.companyId?._id || editingData.companyId || "",
                    branchId: editingData.branchId?._id || editingData.branchId || ""
                });
            } else {
                setFormData({
                    name: "", email: "", password: "",
                    role: isBranchManager ? "sales" : "sales",
                    companyId: isSuperAdmin ? "" : user.companyId?._id || user.companyId || "",
                    branchId: isBranchManager ? user.branchId?._id || user.branchId || "" : "",
                    status: "active"
                });
            }
        }
    }, [isOpen, editingData]);

    useEffect(() => {
        if (formData.companyId && isSuperAdmin) {
            fetchBranches(formData.companyId);
        }
    }, [formData.companyId]);

    const fetchCompanies = async () => {
        try {
            const res = await API.get("/super-admin/companies");
            setCompanies(res.data.companies || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBranches = async (cid) => {
        try {
            const endpoint = isSuperAdmin ? `/super-admin/branches?companyId=${cid}` : `/branches?search=`; // Using search= empty for company-admin
            const res = await API.get(endpoint);
            setBranches(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100">
                <div className="px-10 py-8 text-center relative bg-green-50/30 border-b border-gray-50">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100">
                        <FiX size={22} />
                    </button>
                    <div className="w-16 h-16 bg-green-100/50 rounded-2xl flex items-center justify-center text-green-600 font-black mx-auto mb-6 shadow-inner ring-4 ring-green-50 ring-offset-2 scale-110">
                        <FiUser size={28} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {editingData ? "Synchronize Avatar Node" : "Identity Inbound Gateway"}
                    </h2>
                    <p className="text-gray-400 text-[10px] font-black mt-2 tracking-tight uppercase tracking-[0.2em]">
                        Permission & Authority Management
                    </p>
                </div>

                <form onSubmit={handleFormSubmit} className="px-10 py-10 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Identity Profile Group */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Profile Metadata</label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors pointer-events-none" />
                                <input name="name" required value={formData.name} onChange={handleChange} placeholder="The Avatar's Calling Name..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" />
                            </div>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors pointer-events-none" />
                                <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="Primary Routing Email..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" />
                            </div>
                            <div className="relative group">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors pointer-events-none" />
                                <input name="password" type="password" required={!editingData} value={formData.password} onChange={handleChange} placeholder={editingData ? "Secure Unchanged" : "Assign Secure Code..."} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" />
                            </div>
                        </div>

                        {/* Authority Profile Group */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Privilege Architecture</label>

                            {!isBranchManager && (
                                <div className="relative group">
                                    <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                    <select name="role" required value={formData.role} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer">
                                        <option value="sales">Sales (Level 1)</option>
                                        <option value="branch_manager">Branch Manager (L2)</option>
                                        {isSuperAdmin && <option value="company_admin">Company Admin (L3)</option>}
                                        {isSuperAdmin && <option value="super_admin">Overseer (S-Admin)</option>}
                                    </select>
                                </div>
                            )}

                            {isSuperAdmin && (
                                <div className="relative group">
                                    <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                    <select name="companyId" value={formData.companyId} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer">
                                        <option value="">Global Assignment...</option>
                                        {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {(isSuperAdmin || isCompanyAdmin) && (
                                <div className="relative group">
                                    <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                    <select name="branchId" value={formData.branchId} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer">
                                        <option value="">Specific Node...</option>
                                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="pt-8 flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 font-black rounded-xl text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">Cancel</button>
                        <button type="submit" className="flex-2 px-10 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 text-xs uppercase tracking-widest hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all">Synchronize User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;

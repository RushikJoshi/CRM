import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiArrowLeft, FiSave, FiShield } from "react-icons/fi";
import API from "../../services/api";
import useFormValidation, { rules } from "../../hooks/useFormValidation";
import FieldError from "../../components/FieldError";
import { useToast } from "../../context/ToastContext";
import { getCurrentUser } from "../../context/AuthContext";

const ROLES = [
    { value: "company_admin", label: "Company Admin" },
    { value: "branch_manager", label: "Branch Manager" },
    { value: "sales", label: "Sales User" },
];

export default function UserFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const toast = useToast();

    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.role === "super_admin";
    const isBranchManager = currentUser?.role === "branch_manager";
    const apiBase = isSuperAdmin ? "/super-admin/users" : "/users";

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        name: "", email: "", password: "", role: "sales", branchId: "", status: "active"
    });

    const schema = {
        name: [rules.required("Full name"), rules.minLength(2, "Full name")],
        email: [rules.required("Email"), rules.email()],
        ...(!isEdit && {
            password: [rules.required("Password"), rules.passwordStrength()],
        }),
        role: [rules.required("Role")],
    };
    const { errors, validate, clearError } = useFormValidation(schema);

    // Fetch branches for dropdown
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const url = isSuperAdmin ? "/super-admin/branches" : "/branches";
                const res = await API.get(url);
                const branchesData = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.branches || []);
                setBranches(branchesData);
            } catch { /* branches optional */ }
        };
        fetchBranches();
    }, []);

    // Fetch user data for edit
    useEffect(() => {
        if (!isEdit) {
            setFormData({
                name: "", email: "", password: "", role: "sales", branchId: "", status: "active"
            });
            return;
        }
        (async () => {
            try {
                const res = await API.get(apiBase);
                const resData = res.data?.data || res.data;
                const all = Array.isArray(resData) ? resData : [];
                const user = all.find(u => u._id === id);
                if (user) {
                    setFormData({
                        name: user.name || "", email: user.email || "", password: "",
                        role: user.role || "sales", branchId: user.branchId?._id || user.branchId || "",
                        status: user.status || "active"
                    });
                }
            } catch { toast.error("Failed to load user data"); }
            finally { setFetching(false); }
        })();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        clearError(name);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate(formData)) {
            toast.warning("Please fix the errors before submitting.");
            return;
        }
        setLoading(true);
        try {
            const payload = { ...formData };
            if (isEdit && !payload.password) delete payload.password;
            // Branch managers must NOT send branchId — backend sets it automatically from their token
            if (isBranchManager) delete payload.branchId;

            if (isEdit) {
                await API.put(`${apiBase}/${id}`, payload);
                toast.success("User updated successfully!");
            } else {
                await API.post(apiBase, payload);
                toast.success("User created successfully!");
            }
            navigate(-1);
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const inputCls = (field) =>
        `w-full pl-14 pr-6 py-5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none font-black text-[#1A202C] text-sm transition-all
     focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 shadow-sm placeholder-[#CBD5E0]
     ${errors[field] ? "border-red-200 focus:border-red-300 focus:ring-red-500/5" : ""}`;

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="w-16 h-16 border-[6px] border-blue-50 border-t-blue-500 rounded-full animate-spin shadow-lg" />
                <p className="text-[#A0AEC0] font-black uppercase tracking-[0.3em] text-[11px]">Retrieving Identity Intel...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-10 pb-24 animate-in fade-in duration-1000">
            {/* Header */}
            <div className="bg-white rounded-[32px] border border-[#E5EAF2] shadow-sm p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-3 text-[11px] font-black text-[#A0AEC0] hover:text-blue-600 transition-all mb-8 group uppercase tracking-widest relative z-10">
                    <FiArrowLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                    Reset & Return
                </button>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                        <FiUser size={30} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-[#1A202C] tracking-tighter leading-none mb-2">
                            {isEdit ? "Sync User Profile" : "Provision Operator"}
                        </h1>
                        <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.25em] opacity-80">
                            {isEdit ? "Identity modification and permission sync" : "Initialization of new secure access node"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-8 max-w-5xl mx-auto">
                <div className="bg-white rounded-[40px] border border-[#E5EAF2] shadow-sm p-12 space-y-10 relative overflow-hidden">
                    <h2 className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.35em] flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" /> Identity Matrix & Auth
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Name */}
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                Operator Full Identity <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <FiUser size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input name="name" type="text" placeholder="Full Legal Name..."
                                    className={inputCls("name")} value={formData.name} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.name} />
                        </div>

                        {/* Email */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                Cloud Comm Link <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <FiMail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input name="email" type="email" placeholder="internal@node.com"
                                    className={inputCls("email")} value={formData.email} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.email} />
                        </div>

                        {/* Password */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                Access Key {!isEdit && <span className="text-red-500">*</span>}
                                {isEdit && <span className="text-[#A0AEC0] font-black normal-case opacity-60 ml-2">(Null for persistence)</span>}
                            </label>
                            <div className="relative group">
                                <FiLock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input name="password" type="password" placeholder={isEdit ? "Keep current key..." : "Entropy min 8 chars..."}
                                    className={inputCls("password")} value={formData.password} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.password} />
                        </div>

                        {/* Role */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                Permission Tier <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <FiShield size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <select name="role" className={inputCls("role").replace("pl-14", "pl-14 appearance-none")} value={formData.role} onChange={handleChange}
                                    disabled={isBranchManager}>
                                    {(isBranchManager
                                        ? [{ value: "sales", label: "Sales Operative" }]
                                        : [
                                            { value: "company_admin", label: "Company Overlord" },
                                            { value: "branch_manager", label: "Branch Overseer" },
                                            { value: "sales", label: "Sales Operative" }
                                        ]
                                    ).map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                    <FiArrowLeft className="-rotate-90" size={16} />
                                </div>
                            </div>
                            <FieldError error={errors.role} />
                        </div>

                        {/* Branch */}
                        {branches.length > 0 && !isBranchManager && (
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Operational HUB</label>
                                <div className="relative group">
                                    <select name="branchId" className={inputCls("branchId").replace("pl-14", "pl-6 appearance-none")}
                                        value={formData.branchId} onChange={handleChange}>
                                        <option value="">Global Network Entry</option>
                                        {branches.map(b => <option key={b._id} value={b._id}>{b.name} HUB</option>)}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                        <FiArrowLeft className="-rotate-90" size={16} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Status */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Active Telemetry</label>
                            <div className="relative group">
                                <select name="status" className={inputCls("status").replace("pl-14", "pl-6 appearance-none")}
                                    value={formData.status} onChange={handleChange}>
                                    <option value="active">Active (Online)</option>
                                    <option value="inactive">Restricted (Offline)</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                    <FiArrowLeft className="-rotate-90" size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-6 pt-4">
                    <button type="button" onClick={() => navigate(-1)}
                        className="flex-1 py-5 bg-[#F4F7FB] text-[#A0AEC0] font-black rounded-[24px] border border-[#E5EAF2] hover:bg-slate-100 hover:text-[#718096] transition-all text-[11px] uppercase tracking-[0.25em]">
                        Abort Provisioning
                    </button>
                    <button type="submit" disabled={loading}
                        className="flex-[2] flex items-center justify-center gap-4 py-5 bg-blue-600 text-white font-black rounded-[24px] hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-blue-600/20 disabled:opacity-50 duration-300">
                        {loading ? (
                            <div className="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><FiSave size={20} strokeWidth={3} /> {isEdit ? "Sync Identity Specs" : "Commit Operator Node"}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

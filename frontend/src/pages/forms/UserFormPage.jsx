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
                setBranches(Array.isArray(res.data) ? res.data : res.data?.branches || []);
            } catch { /* branches optional */ }
        };
        fetchBranches();
    }, []);

    // Fetch user data for edit
    useEffect(() => {
        if (!isEdit) return;
        (async () => {
            try {
                const res = await API.get(apiBase);
                const all = Array.isArray(res.data) ? res.data : [];
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
            if (isEdit && !payload.password) delete payload.password; // don't send blank password

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
        `w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-2xl outline-none font-bold text-gray-700 text-sm transition-all
     focus:bg-white focus:ring-4 focus:ring-green-500/10 shadow-sm
     ${errors[field] ? "border-red-300 focus:border-red-400" : "border-transparent focus:border-green-400"}`;

    if (fetching) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-12 h-12 border-4 border-green-100 border-t-green-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-black text-gray-400 hover:text-green-600 transition-colors mb-6 group">
                    <FiArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Users
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <FiUser size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            {isEdit ? "Edit User" : "Create User"}
                        </h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            {isEdit ? "Update user account details" : "Provision a new CRM user account"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                        <FiUser size={12} /> User Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Name */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="name" type="text" placeholder="Rahul Sharma"
                                    className={inputCls("name")} value={formData.name} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.name} />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="email" type="email" placeholder="rahul@company.com"
                                    className={inputCls("email")} value={formData.email} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.email} />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                Password {!isEdit && <span className="text-red-500">*</span>}
                                {isEdit && <span className="text-gray-300 font-normal normal-case">(leave blank to keep)</span>}
                            </label>
                            <div className="relative group">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="password" type="password" placeholder={isEdit ? "Leave blank to keep current" : "Min 8 characters"}
                                    className={inputCls("password")} value={formData.password} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.password} />
                        </div>

                        {/* Role */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <select name="role" className={inputCls("role")} value={formData.role} onChange={handleChange}>
                                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                            <FieldError error={errors.role} />
                        </div>

                        {/* Branch */}
                        {branches.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Branch</label>
                                <select name="branchId" className={inputCls("branchId").replace("pl-12", "pl-4")}
                                    value={formData.branchId} onChange={handleChange}>
                                    <option value="">No specific branch</option>
                                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</label>
                            <select name="status" className={inputCls("status").replace("pl-12", "pl-4")}
                                value={formData.status} onChange={handleChange}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button type="button" onClick={() => navigate(-1)}
                        className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all text-sm uppercase tracking-widest">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading}
                        className="flex-[2] flex items-center justify-center gap-3 py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-xl shadow-green-500/20 disabled:opacity-50">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><FiSave size={18} /> {isEdit ? "Save Changes" : "Create User"}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

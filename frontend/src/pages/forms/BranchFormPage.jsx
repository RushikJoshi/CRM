import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiLayers, FiMail, FiPhone, FiMapPin, FiArrowLeft, FiSave } from "react-icons/fi";
import API from "../../services/api";
import useFormValidation, { rules } from "../../hooks/useFormValidation";
import FieldError from "../../components/FieldError";
import { useToast } from "../../context/ToastContext";
import { getCurrentUser } from "../../context/AuthContext";

export default function BranchFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const toast = useToast();

    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/branches" : "/branches";

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [companies, setCompanies] = useState([]);
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", address: "", companyId: ""
    });

    const schema = {
        name: [rules.required("Branch name"), rules.minLength(2, "Branch name")],
        email: [rules.email()],
        phone: [rules.phone()],
        ...(isSuperAdmin && { companyId: [rules.required("Company")] }),
    };
    const { errors, validate, clearError } = useFormValidation(schema);

    // Fetch companies for SA dropdown
    useEffect(() => {
        if (!isSuperAdmin) return;
        (async () => {
            try {
                const res = await API.get("/super-admin/companies?limit=100");
                setCompanies(res.data?.companies || []);
            } catch { /* silent */ }
        })();
    }, []);

    // Fetch branch data for edit
    useEffect(() => {
        if (!isEdit) return;
        (async () => {
            try {
                const res = await API.get(apiBase);
                const all = Array.isArray(res.data) ? res.data : [];
                const branch = all.find(b => b._id === id);
                if (branch) {
                    setFormData({
                        name: branch.name || "", email: branch.email || "",
                        phone: branch.phone || "", address: branch.address || "",
                        companyId: branch.companyId?._id || branch.companyId || ""
                    });
                }
            } catch { toast.error("Failed to load branch data"); }
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
            if (isEdit) {
                await API.put(`${apiBase}/${id}`, formData);
                toast.success("Branch updated successfully!");
            } else {
                await API.post(apiBase, formData);
                toast.success("Branch created successfully!");
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
                    Back to Branches
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <FiLayers size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            {isEdit ? "Edit Branch" : "Create Branch"}
                        </h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            {isEdit ? "Update branch details" : "Register a new regional branch"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                        <FiLayers size={12} /> Branch Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Company (SA only) */}
                        {isSuperAdmin && (
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    Company <span className="text-red-500">*</span>
                                </label>
                                <select name="companyId" className={inputCls("companyId").replace("pl-12", "pl-4")}
                                    value={formData.companyId} onChange={handleChange}>
                                    <option value="">Select Company</option>
                                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                                <FieldError error={errors.companyId} />
                            </div>
                        )}

                        {/* Branch Name */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                Branch Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="name" type="text" placeholder="Mumbai HQ Branch"
                                    className={inputCls("name")} value={formData.name} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.name} />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</label>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="email" type="email" placeholder="mumbai@company.com"
                                    className={inputCls("email")} value={formData.email} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.email} />
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Phone</label>
                            <div className="relative group">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="phone" type="tel" placeholder="9876543210"
                                    className={inputCls("phone")} value={formData.phone} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.phone} />
                        </div>

                        {/* Address */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Address</label>
                            <div className="relative group">
                                <FiMapPin className="absolute left-4 top-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <textarea name="address" rows={3} placeholder="Branch address..."
                                    className={inputCls("address") + " resize-none"} value={formData.address} onChange={handleChange} />
                            </div>
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
                            <><FiSave size={18} /> {isEdit ? "Save Changes" : "Create Branch"}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

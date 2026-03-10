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
                const compData = res.data?.data || res.data;
                setCompanies(Array.isArray(compData) ? compData : []);
            } catch { /* silent */ }
        })();
    }, []);

    // Fetch branch data for edit
    useEffect(() => {
        if (!isEdit) {
            setFormData({
                name: "", email: "", phone: "", address: "", companyId: ""
            });
            return;
        }
        (async () => {
            try {
                const res = await API.get(apiBase);
                const resData = res.data?.data || res.data;
                const all = Array.isArray(resData) ? resData : [];
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
        `w-full pl-14 pr-6 py-5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none font-black text-[#1A202C] text-sm transition-all
     focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 shadow-sm placeholder-[#CBD5E0]
     ${errors[field] ? "border-red-200 focus:border-red-300 focus:ring-red-500/5" : ""}`;

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="w-16 h-16 border-[6px] border-blue-50 border-t-blue-500 rounded-full animate-spin shadow-lg" />
                <p className="text-[#A0AEC0] font-black uppercase tracking-[0.3em] text-[11px]">Syncing HUB Telemetry...</p>
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
                    Discard Changes
                </button>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                        <FiLayers size={30} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-[#1A202C] tracking-tighter leading-none mb-2">
                            {isEdit ? "Sync Hub Specs" : "Register Hub"}
                        </h1>
                        <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.25em] opacity-80">
                            {isEdit ? "Regional node optimization and telemetry sync" : "Initialization of a new operational network node"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-8 max-w-5xl mx-auto">
                <div className="bg-white rounded-[40px] border border-[#E5EAF2] shadow-sm p-12 space-y-10 relative overflow-hidden">
                    <h2 className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.35em] flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" /> Hub Configuration & Location
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Company (SA only) */}
                        {isSuperAdmin && (
                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                    Parent Entity <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <select name="companyId" className={inputCls("companyId").replace("pl-14", "pl-6 appearance-none")}
                                        value={formData.companyId} onChange={handleChange}>
                                        <option value="">Select Parent Entity...</option>
                                        {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                        <FiArrowLeft className="-rotate-90" size={16} />
                                    </div>
                                </div>
                                <FieldError error={errors.companyId} />
                            </div>
                        )}

                        {/* Branch Name */}
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                Hub Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <FiLayers size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input name="name" type="text" placeholder="Regional Hub Identifier (e.g. Mumbai HQ)..."
                                    className={inputCls("name")} value={formData.name} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.name} />
                        </div>

                        {/* Email */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Hub Link (Email)</label>
                            <div className="relative group">
                                <FiMail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input name="email" type="email" placeholder="hub@network.com"
                                    className={inputCls("email")} value={formData.email} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.email} />
                        </div>

                        {/* Phone */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Command Link (Phone)</label>
                            <div className="relative group">
                                <FiPhone size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input name="phone" type="tel" placeholder="Hub Dial Code..."
                                    className={inputCls("phone")} value={formData.phone} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.phone} />
                        </div>

                        {/* Address */}
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Spatial Position (Address)</label>
                            <div className="relative group">
                                <FiMapPin size={20} className="absolute left-5 top-6 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <textarea name="address" rows={3} placeholder="Exhaustive address telemetry..."
                                    className={inputCls("address").replace("pl-14", "pl-14 py-6") + " resize-none"} value={formData.address} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-6 pt-4">
                    <button type="button" onClick={() => navigate(-1)}
                        className="flex-1 py-5 bg-[#F4F7FB] text-[#A0AEC0] font-black rounded-[24px] border border-[#E5EAF2] hover:bg-slate-100 hover:text-[#718096] transition-all text-[11px] uppercase tracking-[0.25em]">
                        Abort Registration
                    </button>
                    <button type="submit" disabled={loading}
                        className="flex-[2] flex items-center justify-center gap-4 py-5 bg-blue-600 text-white font-black rounded-[24px] hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-blue-600/20 disabled:opacity-50 duration-300">
                        {loading ? (
                            <div className="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><FiSave size={20} strokeWidth={3} /> {isEdit ? "Sync Hub Specs" : "Commit Hub Node"}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

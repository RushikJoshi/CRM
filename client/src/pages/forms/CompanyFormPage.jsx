import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FiBriefcase, FiMail, FiPhone, FiGlobe, FiMapPin, FiUser,
    FiLock, FiShield, FiArrowLeft, FiSave, FiInfo, FiCopy, FiCheck
} from "react-icons/fi";

import API from "../../services/api";
import useFormValidation, { rules } from "../../hooks/useFormValidation";
import FieldError from "../../components/FieldError";
import { useToast } from "../../context/ToastContext";

const INDUSTRIES = [
    "Technology", "Finance", "Healthcare", "Education", "Manufacturing",
    "Retail", "Real Estate", "Logistics", "Consulting", "Other"
];

export default function CompanyFormPage() {
    const { id } = useParams(); // exists when editing
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", website: "", industry: "", address: "",
        adminName: "", adminEmail: "", adminPassword: "",
        customId: ""
    });
    const [copied, setCopied] = useState(false);


    // ── Validation schema ────────────────────────────────────────────────────────
    const schema = {
        name: [rules.required("Company name")],
        email: [rules.required("Email")],
        phone: [],
        website: [],
        ...(!isEdit && {
            adminName: [rules.required("Admin name")],
            adminEmail: [rules.required("Admin email")],
            adminPassword: [rules.required("Password")],
        }),
    };
    const { errors, validate, clearError } = useFormValidation(schema);

    // ── Fetch existing data when editing ─────────────────────────────────────────
    useEffect(() => {
        if (!isEdit) {
            setFormData({
                name: "", email: "", phone: "", website: "", industry: "", address: "",
                adminName: "", adminEmail: "", adminPassword: "",
            });
            return;
        }
        (async () => {
            try {
                const res = await API.get(`/super-admin/companies`);
                const resData = res.data?.data || res.data;
                const all = Array.isArray(resData) ? resData : [];
                const company = all.find(c => c._id === id);
                if (company) {
                    setFormData({
                        name: company.name || "", 
                        email: company.email || "",
                        phone: company.phone || "", 
                        website: company.website || "",
                        industry: company.industry || "", 
                        address: company.address || "",
                        adminName: "", 
                        adminEmail: "", 
                        adminPassword: "",
                        customId: company.customId || ""
                    });

                }
            } catch { toast.error("Failed to load company data"); }
            finally { setFetching(false); }
        })();
    }, [id, isEdit]);

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
                await API.put(`/super-admin/companies/${id}`, formData);
                toast.success("Company updated successfully!");
                navigate(-1);
            } else {
                const res = await API.post("/super-admin/companies", formData);
                toast.success("Company created successfully!");
                const newId = res.data?.data?._id || res.data?._id;
                if (newId) {
                    navigate(`/superadmin/companies/${newId}`);
                } else {
                    navigate(-1);
                }
            }

        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Input style helper ───────────────────────────────────────────────────────
    const inputCls = (field) =>
        `w-full pl-14 pr-6 py-5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none font-black text-[#1A202C] text-sm transition-all
     focus:bg-white focus:ring-4 focus:ring-teal-600/5 focus:border-blue-300 shadow-sm placeholder-[#CBD5E0]
     ${errors[field] ? "border-red-200 focus:border-red-300 focus:ring-red-500/5" : ""}`;

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="w-16 h-16 border-[6px] border-teal-50 border-t-teal-600 rounded-full animate-spin shadow-lg" />
                <p className="text-[#A0AEC0] font-black uppercase tracking-[0.3em] text-[11px]">Loading Company Data...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-10 pb-24 animate-in fade-in duration-1000">
            {/* Header */}
            <div className="bg-white rounded-[32px] border border-[#E5EAF2] shadow-sm p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-3 text-[11px] font-black text-[#A0AEC0] hover:text-teal-700 transition-all mb-8 group uppercase tracking-widest relative z-10">
                    <FiArrowLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                    Discard & Return
                </button>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-teal-700 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-teal-600/20 group-hover:rotate-6 transition-transform">
                        <FiBriefcase size={30} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-[#1A202C] tracking-tighter leading-none mb-2">
                            {isEdit ? `Edit Company (${formData.customId || id})` : "Add Company"}

                        </h1>
                        <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.25em] opacity-80">
                            {isEdit ? "Update company information and enterprise details" : "Add a new company to the system"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-8 w-full">
                {/* Company Details */}
                <div className="bg-white rounded-[40px] border border-[#E5EAF2] shadow-sm p-12 space-y-10 relative overflow-hidden">
                    <h2 className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.35em] flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-teal-600" /> Company Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Company Name */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <FiBriefcase size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <input name="name" type="text" placeholder="Enter company name..."
                                    className={inputCls("name")} value={formData.name} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.name} />
                        </div>

                        {/* Company Custom ID (Read Only) */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                Company ID {isEdit ? "(Permanent)" : "(Auto-generated)"}
                            </label>
                            <div className="relative group">
                                <FiShield size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0]" />
                                <input 
                                    name="customId" 
                                    type="text" 
                                    readOnly 
                                    className={inputCls("customId") + " cursor-not-allowed opacity-70"} 
                                    value={isEdit ? formData.customId : "Will be generated automatically"} 
                                />
                                {isEdit && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(formData.customId);
                                            setCopied(true);
                                            toast.success("ID copied to clipboard!");
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-xl transition-all text-teal-600"
                                        title="Copy Company ID"
                                    >
                                        {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
                                    </button>
                                )}
                            </div>
                        </div>



                        {/* Email */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <FiMail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <input name="email" type="email" placeholder="example@company.com"
                                    className={inputCls("email")} value={formData.email} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.email} />
                        </div>

                        {/* Phone */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Phone Number</label>
                            <div className="relative group">
                                <FiPhone size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <input name="phone" type="tel" placeholder="Enter phone..."
                                    className={inputCls("phone")} value={formData.phone} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.phone} />
                        </div>

                        {/* Website */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Website URL</label>
                            <div className="relative group">
                                <FiGlobe size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <input name="website" type="url" placeholder="https://www.example.com"
                                    className={inputCls("website")} value={formData.website} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.website} />
                        </div>

                        {/* Industry */}
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Industry Sector</label>
                            <div className="relative group">
                                <select name="industry" className={inputCls("industry").replace("pl-14", "pl-6 appearance-none")}
                                    value={formData.industry} onChange={handleChange}>
                                    <option value="">Choose Industry...</option>
                                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                    <FiArrowLeft className="-rotate-90" size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Company Address</label>
                            <div className="relative group">
                                <FiMapPin size={20} className="absolute left-5 top-6 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <textarea name="address" rows={3} placeholder="Enter full office address..."
                                    className={inputCls("address").replace("pl-14", "pl-14 py-6") + " resize-none"} value={formData.address} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin Provisioning (Create only) */}
                {!isEdit && (
                    <div className="bg-white rounded-[40px] border border-[#E5EAF2] shadow-sm p-12 space-y-10 relative overflow-hidden">
                        <h2 className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.35em] flex items-center gap-3 mb-2">
                            <FiShield size={20} strokeWidth={2.5} className="text-teal-700" /> Admin Account Setup
                        </h2>

                        <div className="p-6 bg-teal-50/50 border border-blue-100 rounded-[24px] flex items-start gap-4">
                            <FiInfo className="text-teal-700 mt-1 shrink-0" size={20} strokeWidth={3} />
                            <p className="text-[12px] font-black text-blue-900/70 leading-relaxed uppercase tracking-wide">
                                Create the main administrator account for this company. These credentials will be used for initial login.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                    Admin Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <FiUser size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                    <input name="adminName" type="text" placeholder="Enter admin name..."
                                        className={inputCls("adminName")} value={formData.adminName} onChange={handleChange} />
                                </div>
                                <FieldError error={errors.adminName} />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                    Admin Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <FiMail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                    <input name="adminEmail" type="email" placeholder="admin@company.com"
                                        className={inputCls("adminEmail")} value={formData.adminEmail} onChange={handleChange} />
                                </div>
                                <FieldError error={errors.adminEmail} />
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                    Admin Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <FiLock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                    <input name="adminPassword" type="password" placeholder="Enter strong password..."
                                        className={inputCls("adminPassword")} value={formData.adminPassword} onChange={handleChange} />
                                </div>
                                <FieldError error={errors.adminPassword} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-6 pt-4">
                    <button type="button" onClick={() => navigate(-1)}
                        className="flex-1 py-5 bg-[#F4F7FB] text-[#A0AEC0] font-black rounded-[24px] border border-[#E5EAF2] hover:bg-slate-100 hover:text-[#718096] transition-all text-[11px] uppercase tracking-[0.25em]">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading}
                        className="flex-[2] flex items-center justify-center gap-4 py-5 bg-teal-700 text-white font-black rounded-[24px] hover:bg-teal-800 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-teal-700/20 disabled:opacity-50 duration-300">
                        {loading ? (
                            <div className="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><FiSave size={20} strokeWidth={3} /> {isEdit ? "Update Company" : "Save Company"}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

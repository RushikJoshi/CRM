import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FiBriefcase, FiMail, FiPhone, FiGlobe, FiMapPin, FiUser,
    FiLock, FiShield, FiArrowLeft, FiSave, FiInfo
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
    });

    // ── Validation schema ────────────────────────────────────────────────────────
    const schema = {
        name: [rules.required("Company name"), rules.minLength(2, "Company name")],
        email: [rules.required("Email"), rules.email()],
        phone: [rules.phone()],
        website: [rules.url()],
        ...(!isEdit && {
            adminName: [rules.required("Admin name"), rules.minLength(2, "Admin name")],
            adminEmail: [rules.required("Admin email"), rules.email()],
            adminPassword: [rules.required("Password"), rules.passwordStrength()],
        }),
    };
    const { errors, validate, clearError } = useFormValidation(schema);

    // ── Fetch existing data when editing ─────────────────────────────────────────
    useEffect(() => {
        if (!isEdit) return;
        (async () => {
            try {
                const res = await API.get(`/super-admin/companies`);
                const all = res.data?.companies || [];
                const company = all.find(c => c._id === id);
                if (company) {
                    setFormData({
                        name: company.name || "", email: company.email || "",
                        phone: company.phone || "", website: company.website || "",
                        industry: company.industry || "", address: company.address || "",
                        adminName: "", adminEmail: "", adminPassword: "",
                    });
                }
            } catch { toast.error("Failed to load company data"); }
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
                await API.put(`/super-admin/companies/${id}`, formData);
                toast.success("Company updated successfully!");
            } else {
                await API.post("/super-admin/companies", formData);
                toast.success("Company created successfully!");
            }
            navigate(-1);
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Input style helper ───────────────────────────────────────────────────────
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
        <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* ── Page Header ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-black text-gray-400 hover:text-green-600 transition-colors mb-6 group"
                >
                    <FiArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Companies
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <FiBriefcase size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            {isEdit ? "Edit Company" : "Create Company"}
                        </h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            {isEdit ? "Update company details" : "Register a new enterprise company"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* ── Company Details ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                        <FiBriefcase size={12} /> Company Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Company Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="name" type="text" placeholder="Globex Corporation"
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
                                <input name="email" type="email" placeholder="corp@globex.io"
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

                        {/* Website */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Website</label>
                            <div className="relative group">
                                <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="website" type="url" placeholder="https://globex.io"
                                    className={inputCls("website")} value={formData.website} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.website} />
                        </div>

                        {/* Industry */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Industry</label>
                            <select name="industry" className={inputCls("industry").replace("pl-12", "pl-4")}
                                value={formData.industry} onChange={handleChange}>
                                <option value="">Select Industry</option>
                                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>

                        {/* Address */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Address</label>
                            <div className="relative group">
                                <FiMapPin className="absolute left-4 top-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <textarea name="address" rows={3} placeholder="123 Business Park, Mumbai, India"
                                    className={inputCls("address") + " resize-none"} value={formData.address} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Admin Provisioning (Create only) ── */}
                {!isEdit && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                            <FiShield size={12} /> Admin Account Setup
                        </h2>

                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                            <FiInfo className="text-amber-500 mt-0.5 shrink-0" size={16} />
                            <p className="text-xs font-bold text-amber-700 leading-relaxed">
                                A Company Admin account will be created with these credentials. Share them securely with the company admin.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    Admin Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                    <input name="adminName" type="text" placeholder="Rahul Sharma"
                                        className={inputCls("adminName")} value={formData.adminName} onChange={handleChange} />
                                </div>
                                <FieldError error={errors.adminName} />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    Admin Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                    <input name="adminEmail" type="email" placeholder="admin@globex.io"
                                        className={inputCls("adminEmail")} value={formData.adminEmail} onChange={handleChange} />
                                </div>
                                <FieldError error={errors.adminEmail} />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    Admin Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                    <input name="adminPassword" type="password" placeholder="Min 8 characters"
                                        className={inputCls("adminPassword")} value={formData.adminPassword} onChange={handleChange} />
                                </div>
                                <FieldError error={errors.adminPassword} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Action Buttons ── */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button type="button" onClick={() => navigate(-1)}
                        className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all text-sm uppercase tracking-widest">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading}
                        className="flex-[2] flex items-center justify-center gap-3 py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-xl shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><FiSave size={18} /> {isEdit ? "Save Changes" : "Create Company"}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

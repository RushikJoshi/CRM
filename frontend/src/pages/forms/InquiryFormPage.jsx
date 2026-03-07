import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiInbox, FiUser, FiMail, FiPhone, FiPlus, FiGlobe,
    FiMessageSquare, FiBriefcase, FiArrowLeft, FiSave, FiLayers
} from "react-icons/fi";
import API from "../../services/api";
import useFormValidation, { rules } from "../../hooks/useFormValidation";
import FieldError from "../../components/FieldError";
import { useToast } from "../../context/ToastContext";
import { getCurrentUser } from "../../context/AuthContext";

const SOURCES = ["Manual", "Phone Call", "Walk-in", "Email", "Referral", "Social Media", "Website", "Other"];

export default function InquiryFormPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const currentUser = getCurrentUser() || {};
    const isCompanyAdmin = currentUser.role === "company_admin";
    const [loading, setLoading] = useState(false);

    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", companyName: "",
        source: "Manual", website: "", message: "",
        branchId: ""
    });

    useEffect(() => {
        if (isCompanyAdmin) {
            (async () => {
                try {
                    const res = await API.get("/branches");
                    setBranches(Array.isArray(res.data) ? res.data : []);
                } catch (err) {
                    console.error("Failed to fetch branches:", err);
                }
            })();
        }
    }, [isCompanyAdmin]);

    const schema = {
        name: [rules.required("Prospect name"), rules.minLength(3, "Prospect name")],
        email: [rules.required("Email"), rules.email()],
        phone: [rules.required("Phone number"), rules.phone()],
    };
    const { errors, validate, clearError } = useFormValidation(schema);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        clearError(name);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate(formData)) {
            toast.warning("Please verify all data packets before committing.");
            return;
        }
        setLoading(true);
        try {
            await API.post("/inquiries", formData);
            toast.success("Inquiry registered in the pipeline.");
            navigate(-1);
        } catch (err) {
            toast.error(err.response?.data?.message || "Inquiry registration failed.");
        } finally {
            setLoading(false);
        }
    };

    const inputCls = (field) =>
        `w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-2xl outline-none font-bold text-gray-700 text-sm transition-all
     focus:bg-white focus:ring-4 focus:ring-green-500/10 shadow-sm
     ${errors[field] ? "border-red-300 focus:border-red-400" : "border-transparent focus:border-green-400"}`;

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-black text-gray-400 hover:text-green-600 transition-colors mb-6 group">
                    <FiArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Inquiries
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <FiInbox size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manual Signal Entry</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            Internal Acquisition Protocol
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                        Prospect Identification
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Prospect Name *</label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="name" className={inputCls("name")} placeholder="Full Name..."
                                    value={formData.name} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.name} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email Address *</label>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="email" className={inputCls("email")} placeholder="Email..."
                                    value={formData.email} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.email} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Phone Number *</label>
                            <div className="relative group">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="phone" className={inputCls("phone")} placeholder="+91..."
                                    value={formData.phone} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.phone} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Corporate Label</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="companyName" className={inputCls("companyName")} placeholder="Company Ltd..."
                                    value={formData.companyName} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Signal Source</label>
                            <div className="relative group font-black text-gray-700">
                                <select name="source" className={inputCls("source").replace("pl-12", "pl-4")}
                                    value={formData.source} onChange={handleChange}>
                                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Requirement Notes</label>
                            <div className="relative group">
                                <FiMessageSquare className="absolute left-4 top-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <textarea name="message" rows={3} className={inputCls("message") + " resize-none"}
                                    placeholder="Analyze and record requirements..." value={formData.message} onChange={handleChange} />
                            </div>
                        </div>

                        {isCompanyAdmin && (
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-emerald-600">Route to Target Branch</label>
                                <div className="relative group">
                                    <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                    <select name="branchId" className={inputCls("branchId")}
                                        value={formData.branchId} onChange={handleChange}>
                                        <option value="">Global (No specific branch)</option>
                                        {branches.map(b => (
                                            <option key={b._id} value={b._id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button type="button" onClick={() => navigate(-1)}
                        className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all text-sm uppercase tracking-widest">
                        Abort
                    </button>
                    <button type="submit" disabled={loading}
                        className="flex-[2] flex items-center justify-center gap-3 py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-xl shadow-green-500/20 disabled:opacity-50">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><FiSave size={18} /> Commit Entry</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

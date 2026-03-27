import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiInbox, FiUser, FiMail, FiPhone, FiGlobe,
    FiMessageSquare, FiBriefcase, FiArrowLeft, FiSave, FiLayers,
    FiActivity, FiBook, FiMapPin, FiMap
} from "react-icons/fi";
import API from "../../services/api";
import useFormValidation, { rules } from "../../hooks/useFormValidation";
import FieldError from "../../components/FieldError";
import { useToast } from "../../context/ToastContext";
import { getCurrentUser } from "../../context/AuthContext";

// SOURCES handled dynamically from backend

export default function InquiryFormPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const currentUser = getCurrentUser() || {};
    const isCompanyAdmin = currentUser.role === "company_admin";
    const [loading, setLoading] = useState(false);

    const [branches, setBranches] = useState([]);
    const [leadSources, setLeadSources] = useState([]);
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", companyName: "",
        source: "manual", sourceId: "", website: "", message: "",
        branchId: "", inquiryStatus: "", courseSelected: "", location: "",
        city: "", address: "", value: 0
    });

    useEffect(() => {
        (async () => {
            try {
                if (isCompanyAdmin) {
                    const res = await API.get("/branches");
                    const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
                    setBranches(data);
                }
                const resSources = await API.get("/lead-sources");
                setLeadSources(resSources.data?.data || []);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            }
        })();
    }, [isCompanyAdmin]);

    const schema = {
        name: [rules.required("Full name"), rules.minLength(3, "Full name")],
        email: [rules.required("Email"), rules.email()],
        phone: [rules.required("Mobile number"), rules.phone()],
        city: [rules.required("City")],
        address: [rules.required("Address")],
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
            toast.warning("Please fix the errors before submitting.");
            return;
        }
        setLoading(true);
        try {
            await API.post("/inquiries", formData);
            toast.success("Inquiry created successfully.");
            navigate(-1);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save inquiry.");
        } finally {
            setLoading(false);
        }
    };

    const inputCls = (field) =>
        `w-full pl-12 pr-4 py-3.5 bg-[#F4F7FB] border border-transparent rounded-2xl outline-none font-black text-[#1A202C] text-sm transition-all
     focus:bg-white focus:ring-4 focus:ring-teal-600/5 focus:border-blue-300 shadow-sm placeholder-[#CBD5E0]
     ${errors[field] ? "border-red-200 focus:border-red-300 focus:ring-red-500/5" : ""}`;

    const sectionCard = "bg-white rounded-2xl border border-[#E5EAF2] shadow-sm overflow-hidden";
    const sectionHeader = "flex items-center gap-2 px-4 py-3 bg-[#F8FAFC] border-b border-[#E5EAF2] text-[11px] font-black text-[#1A202C] uppercase tracking-[0.2em]";

    return (
        <div className="flex flex-col min-h-[calc(100vh-6rem)] animate-in fade-in duration-1000">
            {/* Header */}
            <div className="bg-white rounded-[32px] border border-[#E5EAF2] shadow-sm p-8 md:p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-3 text-[11px] font-black text-[#A0AEC0] hover:text-teal-700 transition-all mb-8 group uppercase tracking-widest relative z-10">
                    <FiArrowLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                    Discard & Return
                </button>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-teal-700 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-teal-600/20 group-hover:rotate-6 transition-transform">
                        <FiInbox size={30} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-[#1A202C] tracking-tighter leading-none mb-2">Add Inquiry</h1>
                        <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.25em] opacity-80">
                            Enter inquiry details manually
                        </p>
                    </div>
                </div>
            </div>

            <form id="inquiry-form" onSubmit={handleSubmit} noValidate className="flex-1 min-h-0 overflow-auto pb-24">
                <div className="max-w-[1200px] mx-auto w-full p-4 md:p-6 space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Customer Information */}
                        <div className={sectionCard}>
                            <div className={sectionHeader}><FiUser className="text-teal-700" size={14} /> Customer Information</div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-1">Full Name *</label>
                                    <div className="relative group">
                                        <FiUser size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                        <input name="name" className={inputCls("name")} placeholder="Full name"
                                            value={formData.name} onChange={handleChange} />
                                    </div>
                                    <FieldError error={errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-1">Email *</label>
                                    <div className="relative group">
                                        <FiMail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                        <input name="email" className={inputCls("email")} placeholder="Email address"
                                            value={formData.email} onChange={handleChange} />
                                    </div>
                                    <FieldError error={errors.email} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-1">Phone *</label>
                                    <div className="relative group">
                                        <FiPhone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                        <input name="phone" className={inputCls("phone")} placeholder="Mobile number"
                                            value={formData.phone} onChange={handleChange} />
                                    </div>
                                    <FieldError error={errors.phone} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-1">Expected Value / Budget</label>
                                    <div className="relative group">
                                        <FiActivity size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                        <div className="absolute left-10 top-1/2 -translate-y-1/2 font-black text-teal-700/70">
                                            ₹
                                        </div>
                                        <input
                                            name="value"
                                            type="number"
                                            className={inputCls("value").replace("pl-12", "pl-16")}
                                            placeholder="0"
                                            value={formData.value}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inquiry Details */}
                        <div className={sectionCard}>
                            <div className={sectionHeader}><FiBook className="text-teal-700" size={14} /> Inquiry Details</div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-1">Occupation</label>
                                    <div className="relative group">
                                        <FiBriefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors z-10" />
                                        <select
                                            name="inquiryStatus"
                                            className={inputCls("inquiryStatus").replace("pl-12", "pl-12 appearance-none")}
                                            value={formData.inquiryStatus}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select</option>
                                            <option value="Student">Student</option>
                                            <option value="Working Professional">Working Professional</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                            <FiArrowLeft className="-rotate-90" size={16} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-1">Interested Course</label>
                                    <div className="relative group">
                                        <FiBook size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors z-10" />
                                        <select
                                            name="courseSelected"
                                            className={inputCls("courseSelected").replace("pl-12", "pl-12 appearance-none")}
                                            value={formData.courseSelected}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select</option>
                                            <option value="AI & Automation">AI & Automation Hub</option>
                                            <option value="Cloud & DevOps">Cloud & Systems Architecture</option>
                                            <option value="Cloud Integration Gateway (CIG)">Enterprise Integration (CIG)</option>
                                            <option value="Controlling (CO)">Financial Systems (CO)</option>
                                            <option value="CRM (Customer Relationship Management)">Relationship Intel (CRM)</option>
                                            <option value="Data Analyst/Data Science">Data Intelligence Logic</option>
                                            <option value="Digital Marketing">Market Acceleration</option>
                                            <option value="Financial Accounting (FI)">Ledger Systems (FI)</option>
                                            <option value="Full Stack Development (MERN Stack & Python)">Full Stack Logic (MERN)</option>
                                            <option value="Graphic Designing">Visual Communication</option>
                                            <option value="Human Capital Management (HCM)">Workforce Architecture (HCM)</option>
                                            <option value="Implementation & Configuration">Configuration Logic</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                            <FiArrowLeft className="-rotate-90" size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Source & Location */}
                        <div className={sectionCard}>
                            <div className={sectionHeader}><FiGlobe className="text-teal-700" size={14} /> Source & Location</div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-1">Lead Source</label>
                                    <div className="relative group">
                                        <FiGlobe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors z-10" />
                                        <select
                                            name="source"
                                            className={inputCls("source").replace("pl-12", "pl-12 appearance-none")}
                                            value={formData.source}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select</option>
                                            <option value="Google Search">Google Search</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="Facebook">Facebook</option>
                                            <option value="Friend / Reference">Friend / Reference</option>
                                            <option value="LinkedIn">LinkedIn</option>
                                            <option value="Other">Other</option>
                                            {leadSources.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                            <FiArrowLeft className="-rotate-90" size={16} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-1">Location</label>
                                    <div className="relative group">
                                        <FiMapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors z-10" />
                                        <select
                                            name="location"
                                            className={inputCls("location").replace("pl-12", "pl-12 appearance-none")}
                                            value={formData.location}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select</option>
                                            <option value="Ahmedabad">Ahmedabad</option>
                                            <option value="Kerala">Kerala</option>
                                            <option value="Remote">Remote</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                            <FiArrowLeft className="-rotate-90" size={16} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-1">City *</label>
                                    <div className="relative group">
                                        <FiMapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                        <input name="city" className={inputCls("city")} placeholder="City"
                                            value={formData.city} onChange={handleChange} />
                                    </div>
                                    <FieldError error={errors.city} />
                                </div>
                                {isCompanyAdmin && (
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-1">Assign Branch</label>
                                        <div className="relative group">
                                            <FiLayers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors z-10" />
                                            <select
                                                name="branchId"
                                                className={inputCls("branchId").replace("pl-12", "pl-12 appearance-none")}
                                                value={formData.branchId}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select</option>
                                                {branches.map(b => (
                                                    <option key={b._id} value={b._id}>{b.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                                <FiArrowLeft className="-rotate-90" size={16} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className={sectionCard}>
                            <div className={sectionHeader}><FiMessageSquare className="text-teal-700" size={14} /> Notes</div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-1">Full Address *</label>
                                    <div className="relative group">
                                        <FiMap size={18} className="absolute left-4 top-4 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                        <textarea
                                            name="address"
                                            rows={3}
                                            className={inputCls("address").replace("pl-12", "pl-12 pt-3.5 pb-3.5") + " resize-none"}
                                            placeholder="Full address"
                                            value={formData.address}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <FieldError error={errors.address} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-1">Additional Notes</label>
                                    <div className="relative group">
                                        <FiMessageSquare size={18} className="absolute left-4 top-4 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                        <textarea
                                            name="message"
                                            rows={3}
                                            className={inputCls("message").replace("pl-12", "pl-12 pt-3.5 pb-3.5") + " resize-none"}
                                            placeholder="Additional notes"
                                            value={formData.message}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* Sticky Footer */}
            <div className="shrink-0 sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5EAF2] shadow-lg py-4 px-5 md:px-6">
                <div className="max-w-[1200px] mx-auto w-full flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 rounded-2xl border border-[#E5EAF2] bg-[#F4F7FB] text-[#A0AEC0] font-black hover:bg-slate-100 hover:text-[#718096] transition-all text-[11px] uppercase tracking-[0.25em]"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="inquiry-form"
                        disabled={loading}
                        className="flex items-center justify-center gap-3 px-6 py-2.5 rounded-2xl bg-teal-700 text-white font-black hover:bg-teal-800 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-teal-700/20 disabled:opacity-50 duration-300"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><FiSave size={18} strokeWidth={3} /> Save Inquiry</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

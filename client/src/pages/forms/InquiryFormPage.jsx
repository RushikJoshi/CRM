import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiInbox, FiUser, FiMail, FiPhone, FiPlus, FiGlobe,
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
        source: "Manual", sourceId: "", website: "", message: "",
        branchId: "", inquiryStatus: "", course: "", location: "",
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
        `w-full pl-14 pr-6 py-5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none font-black text-[#1A202C] text-sm transition-all
     focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 shadow-sm placeholder-[#CBD5E0]
     ${errors[field] ? "border-red-200 focus:border-red-300 focus:ring-red-500/5" : ""}`;

    return (
        <div className="w-full space-y-10 pb-24 animate-in fade-in duration-1000">
            {/* Header */}
            <div className="bg-white rounded-[32px] border border-[#E5EAF2] shadow-sm p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-3 text-[11px] font-black text-[#A0AEC0] hover:text-blue-600 transition-all mb-8 group uppercase tracking-widest relative z-10">
                    <FiArrowLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                    Discard & Return
                </button>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-blue-500/20 group-hover:rotate-6 transition-transform">
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

            <form onSubmit={handleSubmit} noValidate className="space-y-8 w-full">
                <div className="bg-white rounded-[40px] border border-[#E5EAF2] shadow-sm p-12 space-y-10 relative overflow-hidden">
                    <h2 className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.35em] flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" /> Inquiry Details & Profile
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Full Name *</label>
                            <div className="relative group">
                                <FiUser size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input name="name" className={inputCls("name")} placeholder="Legal Name..."
                                    value={formData.name} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.name} />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Email Address *</label>
                            <div className="relative group">
                                <FiMail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input name="email" className={inputCls("email")} placeholder="Inquiry Email..."
                                    value={formData.email} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.email} />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Phone Number *</label>
                            <div className="relative group">
                                <FiPhone size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input name="phone" className={inputCls("phone")} placeholder="+91 Terminal..."
                                    value={formData.phone} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.phone} />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Expected Value / Budget</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-blue-600 flex items-center gap-1">
                                    <span className="text-[12px] opacity-40">₹</span>
                                </div>
                                <input
                                    name="value"
                                    type="number"
                                    className={inputCls("value").replace("pl-14", "pl-14")}
                                    placeholder="Budget projection..."
                                    value={formData.value}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Occupation</label>
                            <div className="relative group">
                                <select name="inquiryStatus" className={inputCls("inquiryStatus").replace("pl-14", "pl-6 appearance-none")}
                                    value={formData.inquiryStatus} onChange={handleChange}>
                                    <option value="">Select Status Parameter...</option>
                                    <option value="Student">Academic / Student</option>
                                    <option value="Working Professional">Active Workforce</option>
                                    <option value="Other">Miscellaneous</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                    <FiArrowLeft className="-rotate-90" size={16} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Interested Course</label>
                            <div className="relative group">
                                <select name="course" className={inputCls("course").replace("pl-14", "pl-6 appearance-none")}
                                    value={formData.course} onChange={handleChange}>
                                    <option value="">Select Domain...</option>
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
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                    <FiArrowLeft className="-rotate-90" size={16} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Lead Source</label>
                            <div className="relative group">
                                <select name="source" className={inputCls("source").replace("pl-14", "pl-6 appearance-none")}
                                    value={formData.source} onChange={handleChange}>
                                    <option value="">Acquisition Origin...</option>
                                    <option value="Google Search">Google Ecosystem</option>
                                    <option value="Instagram">Instagram Social</option>
                                    <option value="Facebook">Facebook Meta</option>
                                    <option value="Friend / Reference">Intelligence Referral</option>
                                    <option value="LinkedIn">LinkedIn Professional</option>
                                    <option value="Other">External Channels</option>
                                    {leadSources.map(s => <option key={s._id} value={s.name}>{s.name} (Custom)</option>)}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                    <FiArrowLeft className="-rotate-90" size={16} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Location</label>
                            <div className="relative group">
                                <select name="location" className={inputCls("location").replace("pl-14", "pl-6 appearance-none")}
                                    value={formData.location} onChange={handleChange}>
                                    <option value="">Deployment Zone...</option>
                                    <option value="Ahmedabad">Ahmedabad HUB</option>
                                    <option value="Kerala">Kerala Cluster</option>
                                    <option value="Remote">Remote Operations</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                    <FiArrowLeft className="-rotate-90" size={16} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">City *</label>
                            <div className="relative group">
                                <FiMapPin size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input name="city" className={inputCls("city")} placeholder="City Origin *"
                                    value={formData.city} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Full Address *</label>
                            <div className="relative group">
                                <FiMap size={20} className="absolute left-5 top-6 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <textarea name="address" rows={3} className={inputCls("address").replace("pl-14", "pl-14 py-6") + " resize-none"}
                                    placeholder="Enter full address details *" value={formData.address} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Additional Notes</label>
                            <div className="relative group">
                                <FiMessageSquare size={20} className="absolute left-5 top-6 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <textarea name="message" rows={3} className={inputCls("message").replace("pl-14", "pl-14 py-6") + " resize-none"}
                                    placeholder="Enter any additional details or notes..." value={formData.message} onChange={handleChange} />
                            </div>
                        </div>

                        {isCompanyAdmin && (
                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] ml-2">Assign to Branch (Admin Only)</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-600/30">
                                        <FiLayers size={20} />
                                    </div>
                                    <select name="branchId" className={inputCls("branchId").replace("pl-14", "pl-14 py-5 appearance-none")}
                                        value={formData.branchId} onChange={handleChange}>
                                        <option value="">Global Network Access</option>
                                        {branches.map(b => (
                                            <option key={b._id} value={b._id}>{b.name} HUB</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                        <FiArrowLeft className="-rotate-90" size={16} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 pt-4">
                    <button type="button" onClick={() => navigate(-1)}
                        className="flex-1 py-5 bg-[#F4F7FB] text-[#A0AEC0] font-black rounded-[24px] border border-[#E5EAF2] hover:bg-slate-100 hover:text-[#718096] transition-all text-[11px] uppercase tracking-[0.25em]">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading}
                        className="flex-[2] flex items-center justify-center gap-4 py-5 bg-blue-600 text-white font-black rounded-[24px] hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-blue-600/20 disabled:opacity-50 duration-300">
                        {loading ? (
                            <div className="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><FiSave size={20} strokeWidth={3} /> Save Inquiry</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

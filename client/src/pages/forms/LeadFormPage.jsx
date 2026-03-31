import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiTarget, FiUser, FiMail, FiPhone, FiBriefcase, FiArrowLeft, FiSave } from "react-icons/fi";
import API from "../../services/api";
import useFormValidation, { rules } from "../../hooks/useFormValidation";
import FieldError from "../../components/FieldError";
import CitySelect from "../../components/CitySelect";
import { useToast } from "../../context/ToastContext";
import { getCurrentUser } from "../../context/AuthContext";

const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

export default function LeadFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const toast = useToast();

    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/leads" : "/leads";

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [users, setUsers] = useState([]);
    const [leadSources, setLeadSources] = useState([]);
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", company: "", source: "Website",
        sourceId: "", status: "New", assignedTo: "", notes: "", value: 0,
        cityId: "", city: ""
    });

    const schema = {
        name: [rules.required("Lead name")],
        email: [],
        phone: [],
    };
    const { errors, validate, clearError } = useFormValidation(schema);

    // Fetch users AND lead sources
    useEffect(() => {
        (async () => {
            try {
                const url = isSuperAdmin ? "/super-admin/users" : "/users";
                const res = await API.get(url);
                setUsers(res.data?.data || (Array.isArray(res.data) ? res.data : []));

                const resSources = await API.get("/lead-sources");
                setLeadSources(resSources.data?.data || []);
            } catch { /* silent */ }
        })();
    }, []);

    // Fetch lead for edit
    useEffect(() => {
        if (!isEdit) {
            setFormData({
                name: "", email: "", phone: "", company: "", source: "Website",
                sourceId: "", status: "New", assignedTo: "", notes: "", value: 0,
                cityId: "", city: ""
            });
            return;
        }
        (async () => {
            try {
                const res = await API.get(apiBase);
                const resData = res.data?.data || res.data;
                const all = Array.isArray(resData) ? resData : [];
                const lead = all.find(l => l._id === id);
                if (lead) {
                    setFormData({
                        name: lead.name || "",
                        email: lead.email || "",
                        phone: lead.phone || "",
                        company: lead.company || lead.companyName || "",
                        source: lead.source || "Website",
                        sourceId: lead.sourceId?._id || lead.sourceId || "",
                        status: lead.status || "New",
                        assignedTo: lead.assignedTo?._id || lead.assignedTo || "",
                        notes: lead.notes || "",
                        value: lead.value || 0,
                        cityId: lead.cityId?._id || lead.cityId || "",
                        city: lead.city || ""
                    });
                }
            } catch { toast.error("Failed to load lead data"); }
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
            const dataToSubmit = {
                ...formData,
                sourceId: formData.sourceId === "" ? null : formData.sourceId,
                assignedTo: formData.assignedTo === "" ? null : formData.assignedTo,
                cityId: formData.cityId === "" ? null : formData.cityId
            };

            if (isEdit) {
                await API.put(`/leads/${id}`, dataToSubmit);
                toast.success("Lead updated successfully!");
            } else {
                await API.post("/leads", dataToSubmit);
                toast.success("Lead created successfully!");
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
     focus:bg-white focus:ring-4 focus:ring-teal-600/5 focus:border-blue-300 shadow-sm placeholder-[#CBD5E0]
     ${errors[field] ? "border-red-200 focus:border-red-300 focus:ring-red-500/5" : ""}`;

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="w-16 h-16 border-[6px] border-teal-50 border-t-teal-600 rounded-full animate-spin shadow-lg" />
                <p className="text-[#A0AEC0] font-black uppercase tracking-[0.3em] text-[11px]">Loading Lead...</p>
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
                        <FiTarget size={30} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-[#1A202C] tracking-tighter leading-none mb-2">
                            {isEdit ? "Edit Lead" : "Add Lead"}
                        </h1>
                        <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.25em] opacity-80">
                            {isEdit ? "Update lead details" : "Create a new lead in your pipeline"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-8 w-full">
                <div className="bg-white rounded-[40px] border border-[#E5EAF2] shadow-sm p-12 space-y-10 relative overflow-hidden">
                    <h2 className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.35em] flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-teal-600" /> Lead Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Name */}
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">
                                Lead Name <span className="text-red-500 opacity-50">*</span>
                            </label>
                            <div className="relative group">
                                <FiUser size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <input name="name" type="text" placeholder="Full name of the lead"
                                    className={inputCls("name")} value={formData.name} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.name} />
                        </div>

                        {/* Email */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Email Address</label>
                            <div className="relative group">
                                <FiMail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <input name="email" type="email" placeholder="contact@domain.com"
                                    className={inputCls("email")} value={formData.email} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.email} />
                        </div>

                        {/* Phone */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Phone Number</label>
                            <div className="relative group">
                                <FiPhone size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <input name="phone" type="tel" placeholder="+91"
                                    className={inputCls("phone")} value={formData.phone} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.phone} />
                        </div>

                        {/* City */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">City</label>
                            <CitySelect 
                                value={formData.cityId} 
                                onChange={(id, name) => setFormData(prev => ({ ...prev, cityId: id, city: name }))}
                            />
                        </div>

                        {/* Company */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Company Name</label>
                            <div className="relative group">
                                <FiBriefcase size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <input name="company" type="text" placeholder="Organization Name"
                                    className={inputCls("company")} value={formData.company} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Source */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Lead Source</label>
                            <div className="relative group">
                                <select name="sourceId" className={inputCls("sourceId").replace("pl-14", "pl-6 appearance-none")}
                                    value={formData.sourceId} onChange={handleChange}>
                                    <option value="">Select Source...</option>
                                    {leadSources.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                    <FiArrowLeft className="-rotate-90" size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Lead Status</label>
                            <div className="relative group">
                                <select name="status" className={inputCls("status").replace("pl-14", "pl-6 appearance-none")}
                                    value={formData.status} onChange={handleChange}>
                                    {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                    <FiArrowLeft className="-rotate-90" size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Amount / Value */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2 flex items-center gap-1.5">
                                Estimated Value
                            </label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-teal-700 flex items-center gap-1">
                                    <span className="text-[12px] opacity-40">₹</span>
                                </div>
                                <input name="value" type="number" placeholder="0"
                                    className={inputCls("value").replace("pl-14", "pl-14")} value={formData.value} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Assigned To */}
                        {users.length > 0 && (
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Assign To</label>
                                <div className="relative group">
                                    <select name="assignedTo" className={inputCls("assignedTo").replace("pl-14", "pl-6 appearance-none")}
                                        value={formData.assignedTo} onChange={handleChange}>
                                        <option value="">Unassigned</option>
                                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role.replace('_', ' ')})</option>)}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                        <FiArrowLeft className="-rotate-90" size={16} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Notes</label>
                            <textarea name="notes" rows={4} placeholder="Enter any additional notes..."
                                className={inputCls("notes").replace("pl-14", "pl-6") + " resize-none"}
                                value={formData.notes} onChange={handleChange} />
                        </div>
                    </div>
                </div>

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
                            <><FiSave size={20} strokeWidth={3} /> {isEdit ? "Update Lead" : "Save Lead"}</>
                        )}
                    </button>
                </div>
            </form >
        </div >
    );
}

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiTarget, FiUser, FiMail, FiPhone, FiBriefcase, FiArrowLeft, FiSave } from "react-icons/fi";
import API from "../../services/api";
import useFormValidation, { rules } from "../../hooks/useFormValidation";
import FieldError from "../../components/FieldError";
import { useToast } from "../../context/ToastContext";
import { getCurrentUser } from "../../context/AuthContext";

const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal", "closed"];
const LEAD_SOURCES = ["Website", "Referral", "Cold Call", "Social Media", "Email Campaign", "Walk-in", "Other"];

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
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", company: "", source: "Website",
        status: "new", assignedTo: "", notes: ""
    });

    const schema = {
        name: [rules.required("Lead name"), rules.minLength(2, "Lead name")],
        email: [rules.email()],
        phone: [rules.phone()],
    };
    const { errors, validate, clearError } = useFormValidation(schema);

    // Fetch users for assignment dropdown
    useEffect(() => {
        (async () => {
            try {
                const url = isSuperAdmin ? "/super-admin/users" : "/users";
                const res = await API.get(url);
                setUsers(Array.isArray(res.data) ? res.data : []);
            } catch { /* silent */ }
        })();
    }, []);

    // Fetch lead for edit
    useEffect(() => {
        if (!isEdit) return;
        (async () => {
            try {
                const res = await API.get(`${apiBase}?limit=999`);
                const all = Array.isArray(res.data) ? res.data : [];
                const lead = all.find(l => l._id === id);
                if (lead) {
                    setFormData({
                        name: lead.name || "",
                        email: lead.email || "",
                        phone: lead.phone || "",
                        company: lead.company || lead.companyName || "",
                        source: lead.source || "Website",
                        status: lead.status || "new",
                        assignedTo: lead.assignedTo?._id || lead.assignedTo || "",
                        notes: lead.notes || ""
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
            if (isEdit) {
                await API.put(`/leads/${id}`, formData);
                toast.success("Lead updated successfully!");
            } else {
                await API.post("/leads", formData);
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
                    Back to Leads
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <FiTarget size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            {isEdit ? "Edit Lead" : "Create Lead"}
                        </h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            {isEdit ? "Update lead information" : "Add a new prospect to the pipeline"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                        <FiTarget size={12} /> Lead Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Name */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                Lead Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="name" type="text" placeholder="Rajesh Kumar"
                                    className={inputCls("name")} value={formData.name} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.name} />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</label>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="email" type="email" placeholder="rajesh@client.com"
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

                        {/* Company */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Company</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="company" type="text" placeholder="Client Company Ltd."
                                    className={inputCls("company")} value={formData.company} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Source */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Source</label>
                            <select name="source" className={inputCls("source").replace("pl-12", "pl-4")}
                                value={formData.source} onChange={handleChange}>
                                {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</label>
                            <select name="status" className={inputCls("status").replace("pl-12", "pl-4")}
                                value={formData.status} onChange={handleChange}>
                                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                        </div>

                        {/* Assigned To */}
                        {users.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Assign To</label>
                                <select name="assignedTo" className={inputCls("assignedTo").replace("pl-12", "pl-4")}
                                    value={formData.assignedTo} onChange={handleChange}>
                                    <option value="">Auto-assign</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                                </select>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Notes</label>
                            <textarea name="notes" rows={3} placeholder="Additional context about this lead..."
                                className={inputCls("notes").replace("pl-12", "pl-4") + " resize-none"}
                                value={formData.notes} onChange={handleChange} />
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
                            <><FiSave size={18} /> {isEdit ? "Save Changes" : "Create Lead"}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

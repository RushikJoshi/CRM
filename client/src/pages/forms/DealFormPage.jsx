import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FiTrendingUp, FiBriefcase, FiTarget, FiUser, FiFlag,
    FiArrowLeft, FiSave, FiInfo, FiX
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import API from "../../services/api";
import useFormValidation, { rules } from "../../hooks/useFormValidation";
import FieldError from "../../components/FieldError";
import { useToast } from "../../context/ToastContext";
import { getCurrentUser } from "../../context/AuthContext";

export default function DealFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const toast = useToast();
    const currentUser = getCurrentUser();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [formData, setFormData] = useState({
        title: "", value: 0, stage: "New", lostReason: "",
        leadId: "", companyId: "", assignedTo: ""
    });

    const [companies, setCompanies] = useState([]);
    const [leads, setLeads] = useState([]);
    const [users, setUsers] = useState([]);
    const [masterStages, setMasterStages] = useState([]);

    const isSuperAdmin = currentUser?.role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/deals" : "/deals";

    const schema = {
        title: [rules.required("Deal title"), rules.minLength(3, "Deal title")],
        value: [rules.required("Deal value")],
        stage: [rules.required("Stage")],
        companyId: [rules.required("Company")],
        leadId: [rules.required("Lead")],
        assignedTo: [rules.required("Assigned user")],
    };
    const { errors, validate, clearError } = useFormValidation(schema);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const companyUrl = isSuperAdmin ? "/super-admin/companies" : "/super-admin/companies"; // Adjust if needed
            const [compRes, masterRes] = await Promise.all([
                API.get("/super-admin/companies"),
                API.get("/master?type=deal_stage")
            ]);
            const compData = compRes.data?.data || compRes.data;
            setCompanies(Array.isArray(compData) ? compData : []);
            setMasterStages(masterRes.data?.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (formData.companyId) {
            fetchContextualData(formData.companyId);
        } else {
            setLeads([]);
            setUsers([]);
        }
    }, [formData.companyId]);

    const fetchContextualData = async (cid) => {
        try {
            const [leadsRes, usersRes] = await Promise.all([
                API.get(`/super-admin/leads?companyId=${cid}`),
                API.get(`/super-admin/users?companyId=${cid}`)
            ]);
            setLeads(leadsRes.data || []);
            setUsers(usersRes.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (!isEdit) {
            setFormData({
                title: "", value: 0, stage: "New", lostReason: "",
                leadId: "", companyId: "", assignedTo: ""
            });
            return;
        }
        (async () => {
            try {
                const res = await API.get(apiBase);
                const resData = res.data?.data || res.data;
                const all = Array.isArray(resData) ? resData : [];
                const deal = all.find(d => d._id === id);
                if (deal) {
                    setFormData({
                        title: deal.title || "",
                        value: deal.value || 0,
                        stage: deal.stage || "New",
                        lostReason: deal.lostReason || "",
                        leadId: deal.leadId?._id || deal.leadId || "",
                        companyId: deal.companyId?._id || deal.companyId || "",
                        assignedTo: deal.assignedTo?._id || deal.assignedTo || ""
                    });
                }
            } catch { toast.error("Failed to load deal data"); }
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
            toast.warning("Please fix the validation errors.");
            return;
        }
        setLoading(true);
        try {
            if (isEdit) {
                await API.put(`${apiBase}/${id}`, formData);
                toast.success("Deal synchronized successfully!");
            } else {
                await API.post("/deals", formData);
                toast.success("New deal initialized!");
            }
            navigate(-1);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to process deal.");
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
                <p className="text-[#A0AEC0] font-black uppercase tracking-[0.3em] text-[11px]">Loading Deal Data...</p>
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
                    Cancel & Return
                </button>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                        <FiTrendingUp size={30} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-[#1A202C] tracking-tighter leading-none mb-2">
                            {isEdit ? "Edit Deal" : "New Deal"}
                        </h1>
                        <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.25em] opacity-80">
                            Manage and track your deal details
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Deal Intelligence */}
                <div className="md:col-span-2 bg-white rounded-[40px] border border-[#E5EAF2] shadow-sm p-12 space-y-10 relative overflow-hidden">
                    <h2 className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.35em] flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" /> Deal Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Deal Title *</label>
                            <div className="relative group">
                                <FiBriefcase size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <input name="title" className={inputCls("title")} placeholder="Enter deal name..."
                                    value={formData.title} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.title} />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Deal Value *</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-blue-600 flex items-center gap-1">
                                    <span className="text-[12px] opacity-40">₹</span>
                                </div>
                                <input name="value" type="number" className={inputCls("value").replace("pl-14", "pl-14")} placeholder="Enter amount..."
                                    value={formData.value} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.value} />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Deal Stage *</label>
                            <div className="relative group">
                                <FiTarget size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <select name="stage" className={inputCls("stage").replace("pl-14", "pl-14 py-5 appearance-none")} value={formData.stage} onChange={handleChange}>
                                    <option value="New">New Opportunity</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Proposal">Proposal Sent</option>
                                    <option value="Negotiation">In Negotiation</option>
                                    {masterStages.map(s => <option key={s._id} value={s.name}>{s.name} (Custom)</option>)}
                                    <option value="Closed Won">Closed Won</option>
                                    <option value="Closed Lost">Closed Lost</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                    <FiArrowLeft className="-rotate-90" size={16} />
                                </div>
                            </div>
                            <FieldError error={errors.stage} />
                        </div>

                        {formData.stage === "Closed Lost" && (
                            <div className="space-y-3 md:col-span-2 animate-in slide-in-from-top-4 duration-500">
                                <label className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em] ml-2">Lost Reason *</label>
                                <div className="relative group">
                                    <FiX size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-red-300 group-focus-within:text-red-500 transition-colors" />
                                    <select name="lostReason" className={inputCls("lostReason").replace("bg-[#F4F7FB]", "bg-red-50/20 border-red-100").replace("pl-14", "pl-14 appearance-none")}
                                        value={formData.lostReason} onChange={handleChange}>
                                        <option value="">Select a reason...</option>
                                        <option value="Price too high">Price too high</option>
                                        <option value="Competitor selected">Chose Competitor</option>
                                        <option value="Budget issue">Budget Issues</option>
                                        <option value="No response">No Response</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-red-300">
                                        <FiArrowLeft className="-rotate-90" size={16} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Association Matrix */}
                <div className="md:col-span-2 bg-white rounded-[40px] border border-[#E5EAF2] shadow-sm p-12 space-y-10 relative overflow-hidden">
                    <h2 className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.35em] flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" /> Assignment & Links
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Select Company *</label>
                            <div className="relative group">
                                <FiBriefcase size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <select name="companyId" className={inputCls("companyId").replace("pl-14", "pl-12 py-5 appearance-none")} value={formData.companyId} onChange={handleChange}>
                                    <option value="">Choose Company...</option>
                                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <FieldError error={errors.companyId} />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Select Lead *</label>
                            <div className="relative group">
                                <FiFlag size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <select name="leadId" className={inputCls("leadId").replace("pl-14", "pl-12 py-5 appearance-none")} value={formData.leadId} onChange={handleChange} disabled={!formData.companyId}>
                                    <option value="">Choose Lead...</option>
                                    {leads.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                </select>
                            </div>
                            <FieldError error={errors.leadId} />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Assigned Owner *</label>
                            <div className="relative group">
                                <FiUser size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                <select name="assignedTo" className={inputCls("assignedTo").replace("pl-14", "pl-12 py-5 appearance-none")} value={formData.assignedTo} onChange={handleChange} disabled={!formData.companyId}>
                                    <option value="">Choose User...</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role.replace('_', ' ')})</option>)}
                                </select>
                            </div>
                            <FieldError error={errors.assignedTo} />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row gap-6 pt-6">
                    <button type="button" onClick={() => navigate(-1)}
                        className="flex-1 py-5 bg-[#F4F7FB] text-[#A0AEC0] font-black rounded-[24px] border border-[#E5EAF2] hover:bg-slate-100 hover:text-[#718096] transition-all text-[11px] uppercase tracking-[0.25em]">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading}
                        className="flex-[2] flex items-center justify-center gap-4 py-5 bg-blue-600 text-white font-black rounded-[24px] hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-blue-600/20 disabled:opacity-50 duration-300">
                        {loading ? (
                            <div className="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><FiSave size={20} strokeWidth={3} /> {isEdit ? "Update Deal" : "Save Deal"}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

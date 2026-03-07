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
            setCompanies(compRes.data?.companies || []);
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
        if (!isEdit) return;
        (async () => {
            try {
                const res = await API.get(apiBase);
                const all = Array.isArray(res.data) ? res.data : [];
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-black text-gray-400 hover:text-green-600 transition-colors mb-6 group">
                    <FiArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Pipeline
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <FiTrendingUp size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            {isEdit ? "Edit Deal" : "Initialize Deal"}
                        </h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            Capital Yield Management Node
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Deal Intelligence */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                        Intelligence Matrix
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Deal Title *</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="title" className={inputCls("title")} placeholder="Project Alpha Acquisition..."
                                    value={formData.title} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.title} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Value (INR) *</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 font-black">₹</span>
                                <input name="value" type="number" className={inputCls("value")} placeholder="Value..."
                                    value={formData.value} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.value} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Stage *</label>
                            <div className="relative group">
                                <FiTarget className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <select name="stage" className={inputCls("stage")} value={formData.stage} onChange={handleChange}>
                                    <option value="New">New Opportunity</option>
                                    {masterStages.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                                    <option value="Closed Won">Closed Won</option>
                                    <option value="Closed Lost">Closed Lost</option>
                                </select>
                            </div>
                            <FieldError error={errors.stage} />
                        </div>

                        {formData.stage === "Closed Lost" && (
                            <div className="space-y-1.5 md:col-span-2 animate-in slide-in-from-top-2">
                                <label className="text-[10px] font-black text-red-400 uppercase tracking-widest">Reason for Loss *</label>
                                <div className="relative group">
                                    <FiX className="absolute left-4 top-1/2 -translate-y-1/2 text-red-300 group-focus-within:text-red-500 transition-colors" />
                                    <select name="lostReason" className={inputCls("lostReason").replace("bg-gray-50", "bg-red-50/30")}
                                        value={formData.lostReason} onChange={handleChange}>
                                        <option value="">Select Reason...</option>
                                        <option value="Price too high">Price too high</option>
                                        <option value="Competitor selected">Competitor selected</option>
                                        <option value="Budget issue">Budget issue</option>
                                        <option value="No response">No response</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Association Matrix */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                        Association Matrix
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target Company *</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <select name="companyId" className={inputCls("companyId")} value={formData.companyId} onChange={handleChange}>
                                    <option value="">Select Company...</option>
                                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <FieldError error={errors.companyId} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Linked Lead *</label>
                            <div className="relative group">
                                <FiFlag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <select name="leadId" className={inputCls("leadId")} value={formData.leadId} onChange={handleChange} disabled={!formData.companyId}>
                                    <option value="">Select Lead...</option>
                                    {leads.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                </select>
                            </div>
                            <FieldError error={errors.leadId} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Assigned Overseer *</label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <select name="assignedTo" className={inputCls("assignedTo")} value={formData.assignedTo} onChange={handleChange} disabled={!formData.companyId}>
                                    <option value="">Select Officer...</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                                </select>
                            </div>
                            <FieldError error={errors.assignedTo} />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 pt-4">
                    <button type="button" onClick={() => navigate(-1)}
                        className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all text-sm uppercase tracking-widest">
                        Abort
                    </button>
                    <button type="submit" disabled={loading}
                        className="flex-[2] flex items-center justify-center gap-3 py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-xl shadow-green-500/20 disabled:opacity-50">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><FiSave size={18} /> Synchronize Deal</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FiUser, FiMail, FiPhone, FiBriefcase, FiLayers,
    FiArrowLeft, FiSave, FiSettings
} from "react-icons/fi";
import API from "../../services/api";
import useFormValidation, { rules } from "../../hooks/useFormValidation";
import FieldError from "../../components/FieldError";
import { useToast } from "../../context/ToastContext";

export default function ContactFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [customers, setCustomers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [buyingRoles, setBuyingRoles] = useState([]);
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", customerId: "", department: "", buyingRole: ""
    });

    const schema = {
        name: [rules.required("Contact name"), rules.minLength(3, "Contact name")],
        email: [rules.email()],
        phone: [rules.phone()],
        customerId: [rules.required("Customer assignment")],
    };
    const { errors, validate, clearError } = useFormValidation(schema);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [custRes, masterDept, masterRole] = await Promise.all([
                API.get("/crm/customers?limit=999"),
                API.get("/master?type=department"),
                API.get("/master?type=buying_role")
            ]);
            setCustomers(custRes.data?.data || custRes.data || []);
            setDepartments(masterDept.data?.data || []);
            setBuyingRoles(masterRole.data?.data || []);
        } catch { /* silent */ }
    };

    useEffect(() => {
        if (!isEdit) {
            setFormData({
                name: "", email: "", phone: "", customerId: "", department: "", buyingRole: ""
            });
            return;
        }
        (async () => {
            try {
                const res = await API.get("/crm/contacts");
                const all = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
                const contact = all.find(c => c._id === id);
                if (contact) {
                    setFormData({
                        name: contact.name || "",
                        email: contact.email || "",
                        phone: contact.phone || "",
                        customerId: contact.customerId?._id || contact.customerId || "",
                        department: contact.department || "",
                        buyingRole: contact.buyingRole || "",
                    });
                }
            } catch { toast.error("Failed to load contact data."); }
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
                await API.put(`/crm/contacts/${id}`, formData);
                toast.success("Contact updated successfully.");
            } else {
                await API.post("/crm/contacts", formData);
                toast.success("Contact created successfully.");
            }
            navigate(-1);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save contact.");
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
                <p className="text-[#A0AEC0] font-black uppercase tracking-[0.3em] text-[11px]">Loading Contact...</p>
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
                        <FiUser size={30} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-[#1A202C] tracking-tighter leading-none mb-2">
                            {isEdit ? "Edit Contact" : "Add Contact"}
                        </h1>
                        <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.25em] opacity-80">
                            {isEdit ? "Update contact information" : "Add a new contact person to your system"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-8 w-full">
                {/* Core Matrix */}
                <div className="bg-white rounded-[40px] border border-[#E5EAF2] shadow-sm p-12 space-y-10 relative overflow-hidden">
                    <h2 className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.35em] flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-teal-600" /> Basic Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Full Name *</label>
                            <div className="relative group">
                                <FiUser size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <input name="name" className={inputCls("name")} placeholder="Enter name..."
                                    value={formData.name} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.name} />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Email Address</label>
                            <div className="relative group">
                                <FiMail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <input name="email" className={inputCls("email")} placeholder="example@email.com"
                                    value={formData.email} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.email} />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Phone Number</label>
                            <div className="relative group">
                                <FiPhone size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <input name="phone" className={inputCls("phone")} placeholder="Enter phone..."
                                    value={formData.phone} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.phone} />
                        </div>
                    </div>
                </div>

                {/* Association Matrix */}
                <div className="bg-white rounded-[40px] border border-[#E5EAF2] shadow-sm p-12 space-y-10 relative overflow-hidden">
                    <h2 className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.35em] flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-teal-600" /> Organization Link
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Select Customer *</label>
                            <div className="relative group">
                                <FiBriefcase size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <select name="customerId" className={inputCls("customerId").replace("pl-14", "pl-14 appearance-none")} value={formData.customerId} onChange={handleChange}>
                                    <option value="">Choose Customer...</option>
                                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                    <FiArrowLeft className="-rotate-90" size={16} />
                                </div>
                            </div>
                            <FieldError error={errors.customerId} />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Department</label>
                            <div className="relative group">
                                <FiLayers size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <select name="department" className={inputCls("department").replace("pl-14", "pl-14 appearance-none")} value={formData.department} onChange={handleChange}>
                                    <option value="">General</option>
                                    {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                    <FiArrowLeft className="-rotate-90" size={16} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Buying Role</label>
                            <div className="relative group">
                                <FiSettings size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <select name="buyingRole" className={inputCls("buyingRole").replace("pl-14", "pl-14 appearance-none")} value={formData.buyingRole} onChange={handleChange}>
                                    <option value="">General</option>
                                    {buyingRoles.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                    <FiArrowLeft className="-rotate-90" size={16} />
                                </div>
                            </div>
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
                            <><FiSave size={20} strokeWidth={3} /> {isEdit ? "Update Contact" : "Save Contact"}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

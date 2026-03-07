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
        if (!isEdit) return;
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
            toast.warning("Verification failed. Please refine data nodes.");
            return;
        }
        setLoading(true);
        try {
            if (isEdit) {
                await API.put(`/crm/contacts/${id}`, formData);
                toast.success("Contact personnel record refined.");
            } else {
                await API.post("/crm/contacts", formData);
                toast.success("New personnel node registered.");
            }
            navigate(-1);
        } catch (err) {
            toast.error(err.response?.data?.message || "Personnel registration failed.");
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-black text-gray-400 hover:text-green-600 transition-colors mb-6 group">
                    <FiArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Personnel
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <FiUser size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            {isEdit ? "Refine Person" : "Register Person"}
                        </h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            Personnel Node Configuration
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* Core Matrix */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2"> Core Designation Matrix</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Full Name *</label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="name" className={inputCls("name")} placeholder="Full Name..."
                                    value={formData.name} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.name} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email Routing</label>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="email" className={inputCls("email")} placeholder="Email..."
                                    value={formData.email} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.email} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contact Terminal</label>
                            <div className="relative group">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input name="phone" className={inputCls("phone")} placeholder="Phone..."
                                    value={formData.phone} onChange={handleChange} />
                            </div>
                            <FieldError error={errors.phone} />
                        </div>
                    </div>
                </div>

                {/* Association Matrix */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2"> Association Matrix</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Corporate Parent *</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <select name="customerId" className={inputCls("customerId")} value={formData.customerId} onChange={handleChange}>
                                    <option value="">Link Account...</option>
                                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <FieldError error={errors.customerId} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Department Cluster</label>
                            <div className="relative group">
                                <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <select name="department" className={inputCls("department")} value={formData.department} onChange={handleChange}>
                                    <option value="">N/A</option>
                                    {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Buying Role Matrix</label>
                            <div className="relative group">
                                <FiSettings className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <select name="buyingRole" className={inputCls("buyingRole")} value={formData.buyingRole} onChange={handleChange}>
                                    <option value="">N/A</option>
                                    {buyingRoles.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>
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
                            <><FiSave size={18} /> Synchronize Record</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

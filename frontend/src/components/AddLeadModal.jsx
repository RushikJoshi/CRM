import React, { useState, useEffect } from "react";
import { FiX, FiUser, FiPhone, FiMail, FiBriefcase, FiFlag, FiLayers } from "react-icons/fi";
import API from "../services/api";

const AddLeadModal = ({ isOpen, onClose, onSubmit, editingData }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        companyName: "",
        value: 0,
        source: "Website",
        status: "New",
        priority: "medium",
        assignedTo: "",
        companyId: "",
        branchId: "",
        industry: ""
    });

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [users, setUsers] = useState([]);
    const [masterStatuses, setMasterStatuses] = useState([]);
    const [masterSources, setMasterSources] = useState([]);
    const [masterIndustries, setMasterIndustries] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchCompanies();
            fetchMasterData();
            if (editingData) {
                setFormData({
                    ...editingData,
                    companyId: editingData.companyId?._id || editingData.companyId || "",
                    branchId: editingData.branchId?._id || editingData.branchId || "",
                    assignedTo: editingData.assignedTo?._id || editingData.assignedTo || "",
                    status: editingData.status?._id || editingData.status || "New",
                    source: editingData.source?._id || editingData.source || "Website",
                    industry: editingData.industry?._id || editingData.industry || ""
                });
            } else {
                setFormData({ name: "", email: "", phone: "", companyName: "", value: 0, source: "", status: "", priority: "medium", assignedTo: "", companyId: "", branchId: "", industry: "" });
            }
        }
    }, [isOpen, editingData]);

    useEffect(() => {
        if (formData.companyId) {
            fetchBranches(formData.companyId);
            fetchUsers(formData.companyId);
        } else {
            setBranches([]);
            setUsers([]);
        }
    }, [formData.companyId]);

    const fetchBranches = async (cid) => {
        try {
            const res = await API.get(`/super-admin/branches?companyId=${cid}`);
            setBranches(res.data.branches || []);
        } catch (err) { console.error(err); }
    };

    const fetchMasterData = async () => {
        try {
            const [statusRes, sourceRes, industryRes] = await Promise.all([
                API.get("/master?type=lead_status"),
                API.get("/master?type=lead_source"),
                API.get("/master?type=industry")
            ]);
            setMasterStatuses(statusRes.data.data || []);
            setMasterSources(sourceRes.data.data || []);
            setMasterIndustries(industryRes.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchCompanies = async () => {
        try {
            const res = await API.get("/super-admin/companies");
            setCompanies(res.data.companies || []);
        } catch (err) { console.error(err); }
    };

    const fetchUsers = async (cid) => {
        try {
            const res = await API.get(`/super-admin/users?companyId=${cid}`);
            setUsers(res.data || []);
        } catch (err) { console.error(err); }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100">
                <div className="px-10 py-8 text-center border-b border-gray-50 relative bg-green-50/30">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all active:scale-90 shadow-sm border border-transparent hover:border-gray-100">
                        <FiX size={20} />
                    </button>
                    <div className="w-16 h-16 bg-green-100/50 rounded-2xl flex items-center justify-center text-green-600 font-black mx-auto mb-6 shadow-inner ring-4 ring-green-50 ring-offset-2">
                        <FiFlag size={28} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {editingData ? "Refine Prospect Intelligence" : "Market Inbound Deployment"}
                    </h2>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Jurisdictional Prospect Synchronization</p>
                </div>

                <form onSubmit={handleFormSubmit} className="px-10 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                        <div className="space-y-5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Primary Identity</label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors" />
                                <input name="name" required value={formData.name} onChange={handleChange} placeholder="Full Legal Name..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" />
                            </div>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors" />
                                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Communication Route (Email)..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" />
                            </div>
                            <div className="relative group">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors" />
                                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Contact Terminal (Phone)..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" />
                            </div>
                        </div>

                        <div className="space-y-5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Firmographics & Value</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors" />
                                <input name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Corporate Entity Name..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" />
                            </div>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black group-focus-within:text-green-500 transition-colors">₹</span>
                                <input name="value" type="number" value={formData.value} onChange={handleChange} placeholder="Projected Capital Value..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" />
                            </div>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                <select name="source" value={formData.source} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer">
                                    <option value="">Origin Source...</option>
                                    {masterSources.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="relative group">
                                <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                <select name="industry" value={formData.industry} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer">
                                    <option value="">Select Industry...</option>
                                    {masterIndustries.map(i => <option key={i._id} value={i.name}>{i.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Structural & Status</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                <select name="companyId" required value={formData.companyId} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer">
                                    <option value="">Target Enterprise...</option>
                                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer">
                                    <option value="">Assign Overseer...</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                                </select>
                            </div>
                            <div className="relative group">
                                <FiFlag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer">
                                    <option value="">Pipeline Status...</option>
                                    {masterStatuses.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                    </div>

                    <div className="pt-10 flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-400 font-black rounded-xl text-xs uppercase tracking-widest hover:text-gray-600 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">Abandon</button>
                        <button type="submit" className="flex-2 px-10 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 text-xs uppercase tracking-widest hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all">Synchronize Intelligence</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLeadModal;

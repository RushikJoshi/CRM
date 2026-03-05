import React, { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiGlobe, FiBriefcase, FiMail, FiPhone, FiX } from "react-icons/fi";
import API from "../services/api";

const CustomersPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", website: "", industry: "", customerType: "" });
    const [editingId, setEditingId] = useState(null);
    const [industries, setIndustries] = useState([]);
    const [customerTypes, setCustomerTypes] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/crm/customers?search=${search}`);
            setData(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const [iRes, cRes] = await Promise.all([
                API.get("/master?type=industry"),
                API.get("/master?type=customer_type")
            ]);
            setIndustries(iRes.data.data || []);
            setCustomerTypes(cRes.data.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchData();
        fetchMasterData();
    }, [search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await API.put(`/crm/customers/${editingId}`, formData);
            } else {
                await API.post("/crm/customers", formData);
            }
            setShowModal(false);
            setFormData({ name: "", email: "", phone: "", website: "", industry: "", customerType: "" });
            setEditingId(null);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Customer Accounts</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">Jurisdictional Relationship Management</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group w-full lg:w-64">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find accounts..."
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { setEditingId(null); setFormData({ name: "", email: "", phone: "", website: "", industry: "", customerType: "" }); setShowModal(true); }}
                        className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        <FiPlus size={20} />
                        Establish Account
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50">
                            <tr className="border-b border-gray-100">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Corporate Identity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Sector</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Communication Nodes</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.map((item) => (
                                <tr key={item._id} className="hover:bg-green-50/30 transition-all group animate-in fade-in duration-500">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center">
                                            <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-lg font-black mr-4 group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                                                {item.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 tracking-tight">{item.name}</span>
                                                <span className="text-[10px] text-green-600 font-black flex items-center gap-1.5 mt-1 hover:underline cursor-pointer">
                                                    <FiGlobe size={11} /> {item.website || "Internal Node"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                                            {item.industry || "General Infrastructure"}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 space-y-2">
                                        <p className="text-sm font-bold text-gray-700 flex items-center gap-2.5">
                                            <FiMail className="text-gray-300 group-hover:text-green-500 transition-colors" size={14} />
                                            {item.email || "No routing label"}
                                        </p>
                                        <p className="text-[11px] font-black text-gray-400 flex items-center gap-2.5">
                                            <FiPhone className="text-gray-300 group-hover:text-green-500 transition-colors" size={14} />
                                            {item.phone || "No terminal link"}
                                        </p>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                                            <button
                                                onClick={() => { setEditingId(item._id); setFormData({ name: item.name, email: item.email, phone: item.phone, website: item.website, industry: item.industry }); setShowModal(true); }}
                                                className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all hover:scale-110 active:scale-95"
                                                title="Refine Account"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button
                                                onClick={async () => { if (window.confirm("Purging this account will archive all associated operational nodes. Proceed?")) { await API.delete(`/crm/customers/${item._id}`); fetchData(); } }}
                                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95"
                                                title="Purge Account"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data.length === 0 && !loading && (
                    <div className="p-24 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 text-3xl mb-6 shadow-inner ring-4 ring-gray-50/50">
                            <FiBriefcase />
                        </div>
                        <p className="text-gray-300 font-black uppercase tracking-[0.2em] italic text-xs">No active accounts detected in mission log.</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100">
                        <div className="px-10 py-8 text-center border-b border-gray-50 relative bg-green-50/30">
                            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all active:scale-90 shadow-sm border border-transparent hover:border-gray-100">
                                <FiX size={22} />
                            </button>
                            <div className="w-16 h-16 bg-green-100/50 rounded-2xl flex items-center justify-center text-green-600 font-black mx-auto mb-6 shadow-inner ring-4 ring-green-50 ring-offset-2">
                                <FiBriefcase size={28} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{editingId ? "Refine Account Node" : "Account Inbound Deployment"}</h3>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Jurisdictional Account Synchronization</p>
                        </div>
                        <form onSubmit={handleSubmit} className="px-10 py-10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Corporate Identity</label>
                                    <input required placeholder="Acme Jurisdictions..." className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Routing</label>
                                    <input type="email" placeholder="contact@vault.com" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contact Terminal</label>
                                    <input placeholder="+1 (555) Vector" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Web Domain</label>
                                    <input placeholder="https://..." className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Sector Classification</label>
                                    <select className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm appearance-none cursor-pointer" value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })}>
                                        <option value="">Select Industry...</option>
                                        {industries.map(i => <option key={i._id} value={i.name}>{i.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Relationship Type</label>
                                    <select className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm appearance-none cursor-pointer" value={formData.customerType} onChange={e => setFormData({ ...formData, customerType: e.target.value })}>
                                        <option value="">Select Type...</option>
                                        {customerTypes.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="pt-8 flex gap-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100">Abandon</button>
                                <button type="submit" className="flex-2 px-10 py-4 bg-green-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all">Synchronize Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomersPage;

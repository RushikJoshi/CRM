import React, { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiEdit2, FiMove } from "react-icons/fi";
import API from "../services/api";

const MasterDataPage = () => {
    const [types] = useState([
        { id: "lead_source", name: "Lead Source" },
        { id: "lead_status", name: "Lead Status" },
        { id: "customer_type", name: "Customer Type" },
        { id: "deal_stage", name: "Deal Stage" },
        { id: "industry", name: "Industry" },
        { id: "department", name: "Department" },
        { id: "buying_role", name: "Buying Role" },
        { id: "task_priority", name: "Task Priority" },
        { id: "task_status", name: "Task Status" },
        { id: "call_outcome", name: "Call Outcome" },
        { id: "meeting_outcome", name: "Meeting Outcome" }
    ]);

    const [activeType, setActiveType] = useState("lead_source");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", description: "", status: "active" });
    const [editingId, setEditingId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/master?type=${activeType}&search=${search}`);
            setData(res.data?.data || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeType, search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await API.put(`/master/${editingId}`, { ...formData, type: activeType });
            } else {
                await API.post("/master", { ...formData, type: activeType });
            }
            setShowModal(false);
            setFormData({ name: "", description: "", status: "active" });
            setEditingId(null);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            try {
                await API.delete(`/master/${id}`);
                fetchData();
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Dynamic Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Master Data</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">Manage your system lists and options.</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setFormData({ name: "", description: "", status: "active" }); setShowModal(true); }}
                    className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                    <FiPlus size={20} />
                    Add New
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                {/* Type Selection Terminal */}
                <div className="xl:col-span-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-1.5 h-fit">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 py-2 opacity-50">Lists</p>
                    {types.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveType(t.id)}
                            className={`w-full text-left px-5 py-3.5 rounded-xl font-black text-sm tracking-tight transition-all border border-transparent ${activeType === t.id ? "bg-green-500 text-white shadow-lg shadow-green-500/10 border-green-400" : "text-gray-500 hover:bg-green-50 hover:text-green-600"}`}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>

                {/* Data Table Matrix */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="relative group">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={`Search ${activeType.replace("_", " ")}...`}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 transition-all font-bold text-gray-700 shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50">
                                    <tr className="border-b border-gray-100">
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Name</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Description</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data.map((item) => (
                                        <tr key={item._id} className="hover:bg-green-50/30 transition-all group">
                                            <td className="px-8 py-5">
                                                <span className="font-black text-gray-900 tracking-tight">{item.name}</span>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-gray-500">{item.description || "-"}</td>
                                            <td className="px-8 py-5">
                                                <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest ${item.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0 transition-transform">
                                                    <button onClick={() => { setEditingId(item._id); setFormData({ name: item.name, description: item.description, status: item.status }); setShowModal(true); }} className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"><FiEdit2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {data.length === 0 && !loading && (
                            <div className="p-24 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 text-2xl mx-auto mb-6">
                                    <FiMove />
                                </div>
                                <p className="text-gray-300 font-black uppercase tracking-widest italic text-xs">No items found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">{editingId ? "Edit" : "New"} {activeType.replace("_", " ")}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Item Details</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all font-black">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Name</label>
                                <input
                                    required
                                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-900 shadow-sm"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter name..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 shadow-sm"
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What is this for?"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                                <select
                                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-900 shadow-sm appearance-none cursor-pointer"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="pt-6 flex gap-4 border-t border-gray-50">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-black text-gray-400 uppercase tracking-widest text-[11px] hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                                <button type="submit" className="flex-[2] py-4 bg-green-500 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl shadow-green-500/20 hover:bg-green-600 active:scale-95 transition-all">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterDataPage;

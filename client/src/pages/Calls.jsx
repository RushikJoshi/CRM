import React, { useState, useEffect } from "react";
import { FiPlus, FiPhone, FiClock, FiEdit2, FiX } from "react-icons/fi";
import API from "../services/api";

const CallsPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: "", description: "", status: "Scheduled", time: "", outcome: "" });
    const [editingId, setEditingId] = useState(null);
    const [outcomes, setOutcomes] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get("/crm/calls");
            setData(res.data?.data || (Array.isArray(res.data) ? res.data : []));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const res = await API.get("/master?type=call_outcome");
            setOutcomes(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchData();
        fetchMasterData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await API.put(`/crm/calls/${editingId}`, formData);
            } else {
                await API.post("/crm/calls", formData);
            }
            setShowModal(false);
            setFormData({ title: "", description: "", status: "Scheduled", time: "" });
            setEditingId(null);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Scheduled": return "bg-green-100 text-green-600";
            case "In Progress": return "bg-amber-100 text-amber-600";
            case "Closed": return "bg-emerald-100 text-emerald-600 font-black";
            default: return "bg-slate-100 text-slate-500 uppercase tracking-widest font-black text-[9px] px-2 py-0.5 rounded";
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Call Logs</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">Keep a record of your calls with customers.</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setFormData({ title: "", description: "", status: "Scheduled", time: "" }); setShowModal(true); }}
                    className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                    <FiPlus size={20} />
                    Add Call
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-black text-gray-900">{item.title}</span>
                                        <span className="text-xs text-gray-400 font-bold mt-0.5 line-clamp-1">{item.description || "N/A"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2 text-gray-600 font-bold text-sm">
                                        <FiClock className="text-gray-300" /> {new Date(item.time).toLocaleString() || "N/A"}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`text-[10px] px-3 py-1.5 rounded-xl uppercase tracking-[0.2em] font-black ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right space-x-1">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingId(item._id); setFormData({ title: item.title, description: item.description, status: item.status, time: item.time ? new Date(item.time).toISOString().slice(0, 16) : "" }); setShowModal(true); }} className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-green-600 hover:border-green-100 hover:bg-green-50 rounded-xl transition-all shadow-sm"><FiEdit2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.length === 0 && !loading && (
                    <div className="p-20 text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6 shadow-inner"><FiPhone size={32} /></div>
                        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[11px]">No call logs found</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-xl font-black text-gray-900">{editingId ? "Edit Call" : "Add Call"}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-colors"><FiX size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Call Title</label>
                                <input required placeholder="E.g., Intro Call with Acme Corp..." className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Call Summary</label>
                                <textarea placeholder="Discussion points, action items, etc..." className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm resize-none" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Status</label>
                                    <select className="w-full pl-5 pr-10 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm tracking-wide cursor-pointer appearance-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Scheduled">Scheduled</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Closed">Closed</option>
                                        {outcomes.map(o => <option key={o._id} value={o.name}>{o.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date & Time</label>
                                    <input type="datetime-local" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                                </div>
                            </div>
                            <div className="pt-6 flex gap-4 border-t border-gray-50">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-[11px] uppercase tracking-widest">{editingId ? 'Save Changes' : 'Save Call'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallsPage;

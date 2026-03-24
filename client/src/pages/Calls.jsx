import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiPhone, FiClock, FiEdit2, FiX, FiSearch, FiCalendar } from "react-icons/fi";
import API from "../services/api";
import { getCurrentUser } from "../context/AuthContext";
import Pagination from "../components/Pagination";

const CallsPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    const [formData, setFormData] = useState({ title: "", description: "", status: "Scheduled", time: "", outcome: "" });
    const [editingId, setEditingId] = useState(null);
    const [outcomes, setOutcomes] = useState([]);
    const [search, setSearch] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/crm/calls?search=${encodeURIComponent(search)}&page=${page}&limit=${pageSize}`);
            setData(res.data?.data || (Array.isArray(res.data) ? res.data : []));
            setTotalPages(res.data?.totalPages ?? 1);
            setTotal(res.data?.total ?? 0);
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

    useEffect(() => { setPage(page); }, [search]);
    useEffect(() => {
        fetchData();
        fetchMasterData();
    }, [page, search]);

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
            case "Scheduled": return "bg-blue-50 text-blue-600 border-blue-100";
            case "In Progress": return "bg-amber-50 text-amber-600 border-amber-100";
            case "Closed": return "bg-green-50 text-green-600 border-green-100";
            default: return "bg-gray-50 text-gray-400 border-gray-100";
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex-1 min-w-[300px] relative group">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search call logs..."
                        className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-gray-700 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => {
                            const user = getCurrentUser();
                            const role = user?.role;
                            const base = role === 'super_admin' ? '/superadmin' : (role === 'sales' ? '/sales' : (role === 'branch_manager' ? '/branch' : '/company'));
                            navigate(`${base}/calendar`);
                        }}
                        className="text-xs font-bold text-teal-600 px-3 py-2 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-100 transition-colors shadow-sm active:scale-95 flex items-center gap-2"
                    >
                        <FiCalendar size={14} />
                        Calendar View
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border shadow-sm p-12 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-teal-50 border-t-teal-600 rounded-full animate-spin" />
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Loading Calls...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border shadow-sm p-4 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Title</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Date & Time</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {data.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 text-sm">{item.title}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider line-clamp-1">{item.description || "No description"}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 text-gray-500 font-medium text-xs">
                                                    <FiClock size={14} className="text-teal-500" /> 
                                                    {item.time ? new Date(item.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "Not set"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button 
                                                    onClick={() => { setEditingId(item._id); setFormData({ title: item.title, description: item.description, status: item.status, time: item.time ? new Date(item.time).toISOString().slice(0, 16) : "" }); setShowModal(true); }} 
                                                    className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-24 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No calls found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                </div>
            )}

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

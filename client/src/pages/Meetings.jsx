import React, { useState, useEffect } from "react";
import { FiPlus, FiCalendar, FiMapPin, FiClock, FiEdit2, FiX } from "react-icons/fi";
import API from "../services/api";

const MeetingsPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: "", description: "", startDate: "", endDate: "", location: "", status: "Scheduled" });
    const [editingId, setEditingId] = useState(null);
    const [outcomes, setOutcomes] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get("/crm/meetings");
            setData(res.data?.data || (Array.isArray(res.data) ? res.data : []));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const res = await API.get("/master?type=meeting_outcome");
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
                await API.put(`/crm/meetings/${editingId}`, formData);
            } else {
                await API.post("/crm/meetings", formData);
            }
            setShowModal(false);
            setFormData({ title: "", description: "", startDate: "", endDate: "", location: "" });
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Team Meetings</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">Keep track of your upcoming and past meetings.</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setFormData({ title: "", description: "", startDate: "", endDate: "", location: "", status: "Scheduled" }); setShowModal(true); }}
                    className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                    <FiPlus size={20} />
                    Add Meeting
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.map((item) => (
                    <div key={item._id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative group overflow-hidden flex flex-col h-full">
                        <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingId(item._id); setFormData({ title: item.title, description: item.description, startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : "", endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : "", location: item.location, status: item.status || "Scheduled" }); setShowModal(true); }} className="p-2.5 bg-white text-gray-400 hover:text-green-600 border border-gray-100 hover:border-green-100 hover:bg-green-50 rounded-xl shadow-sm transition-all"><FiEdit2 size={16} /></button>
                        </div>
                        <div className="p-3.5 bg-green-50 text-green-600 rounded-[1.25rem] w-fit mb-6 shadow-sm"><FiCalendar size={24} /></div>
                        <h3 className="text-xl font-black text-gray-900 mb-3 truncate pr-16">{item.title}</h3>
                        <p className="text-sm text-gray-500 font-bold mb-6 line-clamp-3 flex-1">{item.description || "No description."}</p>

                        <div className="space-y-3 pt-5 border-t border-gray-100 mt-auto">
                            <div className="flex items-center gap-3 text-xs font-black tracking-wide text-gray-400">
                                <FiClock size={16} className="text-gray-300" /> {new Date(item.startDate).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-3 text-xs font-black tracking-wide text-gray-400">
                                <FiMapPin size={16} className="text-gray-300" /> {item.location || "Online / To be decided"}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {data.length === 0 && !loading && (
                <div className="p-20 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6 shadow-inner"><FiCalendar size={32} /></div>
                    <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[11px]">No meetings scheduled</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-xl font-black text-gray-900">{editingId ? "Edit Meeting" : "Add Meeting"}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-colors"><FiX size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Title</label>
                                <input required placeholder="Enter title..." className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Description</label>
                                <textarea placeholder="Enter description..." className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm resize-none" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Start Date & Time</label>
                                    <input type="datetime-local" required className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">End Date & Time</label>
                                    <input type="datetime-local" required className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Location / Link</label>
                                <input placeholder="Where or how to meet..." className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Status</label>
                                <select className="w-full pl-5 pr-10 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm tracking-wide cursor-pointer appearance-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                    {outcomes.map(o => <option key={o._id} value={o.name}>{o.name}</option>)}
                                </select>
                            </div>
                            <div className="pt-6 flex gap-4 border-t border-gray-50">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-[11px] uppercase tracking-widest">{editingId ? 'Save Changes' : 'Save Meeting'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingsPage;

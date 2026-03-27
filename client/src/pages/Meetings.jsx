import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiCalendar, FiMapPin, FiClock, FiEdit2, FiX, FiSearch } from "react-icons/fi";
import API from "../services/api";
import { getCurrentUser } from "../context/AuthContext";
import Pagination from "../components/Pagination";

const MeetingsPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 100;

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        status: "Scheduled",
        channel: "online",
        onlineUrl: "",
        sendEmailReminder: false,
        sendSmsReminder: false,
    });
    const [editingId, setEditingId] = useState(null);
    const [outcomes, setOutcomes] = useState([]);

    const [search, setSearch] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/crm/meetings?search=${encodeURIComponent(search)}&page=${page}&limit=${pageSize}`);
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
            const res = await API.get("/master?type=meeting_outcome");
            setOutcomes(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => {
        fetchData();
        fetchMasterData();
    }, [page, search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await API.put(`/crm/meetings/${editingId}`, formData);
            } else {
                await API.post("/crm/meetings", formData);
            }
            setShowModal(false);
            setFormData({
                title: "",
                description: "",
                startDate: "",
                endDate: "",
                location: "",
                status: "Scheduled",
                channel: "online",
                onlineUrl: "",
                sendEmailReminder: false,
                sendSmsReminder: false,
            });
            setEditingId(null);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex-1 min-w-[300px] relative">
                    <input
                        type="text"
                        placeholder="Search meetings..."
                        className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-gray-700 text-sm"
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
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Loading Meetings...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {data.map((item) => (
                            <div key={item._id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative group flex flex-col h-full bg-gradient-to-b from-white to-gray-50/30">
                                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setEditingId(item._id);
                                            setFormData({
                                                title: item.title,
                                                description: item.description || "",
                                                startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : "",
                                                endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : "",
                                                location: item.location || "",
                                                status: item.status || "Scheduled",
                                                channel: item.channel || "online",
                                                onlineUrl: item.onlineUrl || "",
                                                sendEmailReminder: !!item.sendEmailReminder,
                                                sendSmsReminder: !!item.sendSmsReminder,
                                            });
                                            setShowModal(true);
                                        }}
                                        className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                                    ><FiEdit2 size={16} /></button>
                                </div>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg"><FiCalendar size={20} /></div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 leading-tight mb-1">{item.title}</h3>
                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                            item.status === 'Completed' ? 'bg-green-50 text-green-600' : 
                                            item.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 font-medium mb-4 line-clamp-2 flex-1">{item.description || "No description provided."}</p>

                                <div className="space-y-2 pt-4 border-t border-gray-100 mt-auto">
                                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                                        <FiClock size={12} className="text-teal-500" /> 
                                        {new Date(item.startDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                                        <FiMapPin size={12} className="text-teal-500" />
                                        <span className="truncate">
                                            {item.channel === "phone" && "Phone"}
                                            {item.channel === "in_person" && (item.location || "Office")}
                                            {item.channel === "online" && (item.location || "Online")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {data.length === 0 && (
                        <div className="p-20 text-center flex flex-col items-center justify-center bg-white rounded-xl border">
                            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6"><FiCalendar size={32} /></div>
                            <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[11px]">No meetings scheduled</p>
                        </div>
                    )}
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
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
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Channel</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: "online", label: "Online" },
                                        { id: "phone", label: "Phone" },
                                        { id: "in_person", label: "In person" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, channel: opt.id })}
                                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                                                formData.channel === opt.id
                                                    ? "bg-green-500 text-white border-green-500 shadow-sm"
                                                    : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Online Link / Location</label>
                                <input
                                    placeholder={formData.channel === "in_person" ? "Meeting location (office, address...)" : "Meeting link (Zoom, Google Meet...)"}
                                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                                    value={formData.channel === "online" ? formData.onlineUrl : formData.location}
                                    onChange={e =>
                                        setFormData(
                                            formData.channel === "online"
                                                ? { ...formData, onlineUrl: e.target.value }
                                                : { ...formData, location: e.target.value }
                                        )
                                    }
                                />
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
                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-green-500 focus:ring-green-400"
                                            checked={formData.sendEmailReminder}
                                            onChange={e => setFormData({ ...formData, sendEmailReminder: e.target.checked })}
                                        />
                                        Email reminder
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-green-500 focus:ring-green-400"
                                            checked={formData.sendSmsReminder}
                                            onChange={e => setFormData({ ...formData, sendSmsReminder: e.target.checked })}
                                        />
                                        SMS reminder
                                    </label>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-4 border-t border-gray-50">
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

import React, { useState, useEffect } from "react";
import { FiPlus, FiCheckSquare, FiAlertCircle, FiClock, FiEdit2, FiTrash2, FiFlag } from "react-icons/fi";
import API from "../services/api";

const TodosPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ task: "", status: "Pending", priority: "Medium", dueDate: "" });
    const [editingId, setEditingId] = useState(null);
    const [priorities, setPriorities] = useState([]);
    const [statuses, setStatuses] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get("/crm/todos");
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const [pRes, sRes] = await Promise.all([
                API.get("/master?type=task_priority"),
                API.get("/master?type=task_status")
            ]);
            setPriorities(pRes.data.data || []);
            setStatuses(sRes.data.data || []);
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
                await API.put(`/crm/todos/${editingId}`, formData);
            } else {
                await API.post("/crm/todos", formData);
            }
            setShowModal(false);
            setFormData({ task: "", status: "Pending", priority: "Medium", dueDate: "" });
            setEditingId(null);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "High": return "text-red-500 bg-red-50";
            case "Medium": return "text-amber-500 bg-amber-50";
            case "Low": return "text-emerald-500 bg-emerald-50";
            default: return "text-gray-500 bg-gray-50";
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Task Management</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">Capture todos, set priorities, and track progress.</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setFormData({ task: "", status: "Pending", priority: "Medium", dueDate: "" }); setShowModal(true); }}
                    className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                    <FiPlus size={20} />
                    New Task
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Active Tasks */}
                <div className="space-y-6">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Active Pipeline
                    </h3>
                    <div className="space-y-4">
                        {data.filter(t => t.status !== 'Completed').map((item) => (
                            <div key={item._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-5 hover:shadow-md transition-all group">
                                <button onClick={async () => { await API.put(`/crm/todos/${item._id}`, { status: 'Completed' }); fetchData(); }} className="mt-1 w-7 h-7 rounded-[10px] border-[2.5px] border-gray-200 flex items-center justify-center text-transparent hover:border-green-500 hover:text-green-500 transition-all bg-gray-50 flex-shrink-0"><FiCheckSquare size={16} /></button>
                                <div className="flex-1 space-y-2">
                                    <h4 className="font-black text-gray-900 text-lg leading-tight">{item.task}</h4>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${getPriorityColor(item.priority).replace('text-', 'border-').replace('text-red-500', 'border-red-200').replace('text-amber-500', 'border-amber-200').replace('text-emerald-500', 'border-emerald-200')} ${getPriorityColor(item.priority)}`}>
                                            <FiFlag size={10} /> {item.priority}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                            <FiClock size={12} className="text-gray-400" /> {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "No deadline"}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingId(item._id); setFormData({ task: item.task, status: item.status, priority: item.priority, dueDate: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : "" }); setShowModal(true); }} className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all border border-transparent hover:border-green-100"><FiEdit2 size={16} /></button>
                                    <button onClick={async () => { if (window.confirm("Archive task?")) { await API.delete(`/crm/todos/${item._id}`); fetchData(); } }} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"><FiTrash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                        {data.filter(t => t.status !== 'Completed').length === 0 && (
                            <div className="p-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center bg-gray-50/50">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-300 mb-4 shadow-sm border border-gray-100"><FiCheckSquare size={24} /></div>
                                <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">No active tasks. Inbox zero!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Completed Tasks */}
                <div className="space-y-6">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                        Archived / Completed
                    </h3>
                    <div className="opacity-75 relative space-y-3">
                        <div className="absolute top-0 bottom-0 left-6 w-px bg-gray-200 z-0"></div>
                        {data.filter(t => t.status === 'Completed').map((item) => (
                            <div key={item._id} className="relative z-10 p-5 bg-white/60 rounded-3xl border border-gray-100 flex items-center gap-5 hover:bg-white transition-all group backdrop-blur-sm">
                                <div className="w-8 h-8 rounded-xl bg-green-50 border border-green-100 text-green-500 flex items-center justify-center shadow-sm flex-shrink-0"><FiCheckSquare size={16} /></div>
                                <h4 className="flex-1 font-bold text-gray-500 line-through text-sm">{item.task}</h4>
                                <button onClick={async () => { await API.delete(`/crm/todos/${item._id}`); fetchData(); }} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><FiTrash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-xl font-black text-gray-900">{editingId ? "Update Task" : "Draft New Task"}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-colors"><FiCheckSquare size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Task Breakdown</label>
                                <input required placeholder="E.g., Client follow-up, Report prep..." className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-800 text-sm shadow-sm" value={formData.task} onChange={e => setFormData({ ...formData, task: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 ml-1">Lifecycle Status</label>
                                    <select className="w-full pl-5 pr-10 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm shadow-sm appearance-none cursor-pointer" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        {statuses.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 ml-1">Criticality Index</label>
                                    <select className="w-full pl-5 pr-10 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm shadow-sm appearance-none cursor-pointer" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                        {priorities.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Deadline</label>
                                <input type="date" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm shadow-sm" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                            </div>
                            <div className="pt-6 flex gap-4 border-t border-gray-50">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-[11px] uppercase tracking-widest">{editingId ? 'Update' : 'Save Task'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodosPage;

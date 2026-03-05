import React, { useState, useEffect } from "react";
import { FiPlus, FiCpu, FiTrash2, FiPlay, FiSettings, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import API from "../services/api";

const Automation = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        trigger: "lead_created",
        actions: [{ type: "create_notification", params: { title: "New Lead Action", message: "Automation Rule triggered!" } }],
        status: "active"
    });

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await API.get("/automation");
            setRules(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post("/automation", formData);
            setShowModal(false);
            setFormData({
                name: "",
                trigger: "lead_created",
                actions: [{ type: "create_notification", params: { title: "New Lead Action", message: "Automation Rule triggered!" } }],
                status: "active"
            });
            fetchRules();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Confirm deletion of this automation logic?")) {
            try {
                await API.delete(`/automation/${id}`);
                fetchRules();
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <FiCpu className="text-green-500" /> Organizational Workflows
                    </h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">Engineer autonomous logic triggers across your sales hierarchy.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                    <FiPlus size={20} />
                    Configure Automation
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rules.map((rule) => (
                    <div key={rule._id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-2.5 h-full ${rule.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-4 bg-green-50 text-green-600 rounded-2xl shadow-inner border border-green-100/50">
                                <FiPlay size={20} />
                            </div>
                            <button onClick={() => handleDelete(rule._id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                <FiTrash2 size={18} />
                            </button>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2 leading-tight">{rule.name}</h3>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Trigger: {rule.trigger.replace("_", " ")}</p>
                        </div>

                        <div className="space-y-3 pt-6 border-t border-gray-50">
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Execution Pipeline</p>
                            {rule.actions.map((action, i) => (
                                <div key={i} className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100 text-[11px] font-bold text-gray-600 group-hover:bg-white transition-colors">
                                    <FiCheckCircle className="text-green-500" />
                                    <span className="uppercase tracking-tight">{action.type.replace("_", " ")}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {rules.length === 0 && !loading && (
                    <div className="col-span-full py-32 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-gray-200 mb-6 shadow-sm border border-gray-100">
                            <FiCpu size={40} />
                        </div>
                        <h3 className="text-xl font-black text-gray-400 uppercase tracking-[0.2em]">No Active Workflows</h3>
                        <p className="text-gray-400 text-xs mt-3 max-w-xs font-bold leading-relaxed opacity-60">Initialize autonomous triggers to streamline organizational operations across all decentralized nodes.</p>
                    </div>
                )}
            </div>

            {/* Config Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 text-left">
                        <div className="px-10 py-8 border-b border-gray-50 relative bg-gray-50/50">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Logic Configuration Matrix</h2>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Autonomous Trigger Definition</p>
                            <button onClick={() => setShowModal(false)} className="absolute top-8 right-10 p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Workflow Label</label>
                                <input required className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-800 shadow-sm"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Lead Inbound Alert" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Trigger</label>
                                <div className="relative">
                                    <select className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 shadow-sm appearance-none cursor-pointer"
                                        value={formData.trigger} onChange={e => setFormData({ ...formData, trigger: e.target.value })}>
                                        <option value="lead_created">New Lead Inbound</option>
                                        <option value="deal_stage_changed">Opportunity Evolution (Stage Change)</option>
                                        <option value="meeting_scheduled">Meeting Scheduled</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <FiSettings size={18} />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-8 flex gap-4 border-t border-gray-50">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 font-black text-gray-400 uppercase tracking-widest text-[11px] hover:bg-gray-50 rounded-2xl transition-all">Abort Action</button>
                                <button type="submit" className="flex-[2] py-5 bg-green-500 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl shadow-green-500/20 hover:bg-green-600 active:scale-95 transition-all">Initialize Workflow</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Automation;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { FiArrowLeft, FiSend, FiInbox, FiTrendingUp, FiMessageSquare, FiMail, FiClock, FiSettings, FiUser, FiInfo } from "react-icons/fi";

const CampaignFormPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [audienceCount, setAudienceCount] = useState(0);

    const [form, setForm] = useState({
        name: "",
        channel: "WHATSAPP",
        audienceType: "LEADS",
        message: "Hi {{name}}, we're launching a priority session today. Secure your spot now!",
        scheduledAt: new Date().toISOString().slice(0, 16),
        batchSize: 30,
        delayBetweenBatches: 10
    });

    useEffect(() => {
        fetchAudienceCount();
    }, [form.audienceType]);

    const fetchAudienceCount = async () => {
        try {
            const res = await API.get(`/mass-messaging/audience/count?type=${form.audienceType}`);
            setAudienceCount(res.data?.count || 0);
        } catch (err) {
            console.error("Audience count fetch failed");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.message) return toast.error("Complete the required fields.");
        
        setLoading(true);
        try {
            await API.post("/mass-messaging/create", form);
            toast.success("Broadcast engine initialized and campaign scheduled.");
            navigate("../mass-messaging");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to launch campaign.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-12 pb-24 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <header className="flex items-center gap-6">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-4 rounded-2xl bg-white text-slate-400 hover:text-slate-600 transition-colors shadow-sm border border-slate-100"
                >
                    <FiArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                        New Broadcast Run
                    </h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Configure secure mass-distribution parameters</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Configuration */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white rounded-[40px] p-8 lg:p-12 shadow-2xl shadow-indigo-100/40 border border-slate-100 space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <FiSend size={150} className="rotate-12" />
                        </div>
                        
                        <div className="space-y-6">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Run Identification</label>
                            <input 
                                type="text"
                                placeholder="e.g., April Lead Burst 2024"
                                value={form.name}
                                onChange={(e) => setForm({...form, name: e.target.value})}
                                required
                                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-3xl px-8 py-5 text-lg font-bold text-slate-800 outline-none focus:border-indigo-500/30 transition-all placeholder:text-slate-300"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Channel Selection</label>
                                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                    {["WHATSAPP", "EMAIL"].map(ch => (
                                        <button
                                            key={ch}
                                            type="button"
                                            onClick={() => setForm({...form, channel: ch})}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${form.channel === ch ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                                        >
                                            {ch === "WHATSAPP" ? <FiMessageSquare /> : <FiMail />}
                                            {ch}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Target Audience</label>
                                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                    {["LEADS", "INQUIRIES"].map(aud => (
                                        <button
                                            key={aud}
                                            type="button"
                                            onClick={() => setForm({...form, audienceType: aud})}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${form.audienceType === aud ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                                        >
                                            {aud === "LEADS" ? <FiTrendingUp /> : <FiInbox />}
                                            {aud}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-1">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest italic">Messaging Content Engine</label>
                                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase">Dynamic Variables Active</span>
                            </div>
                            <div className="relative group">
                                <textarea 
                                    rows="6"
                                    value={form.message}
                                    onChange={(e) => setForm({...form, message: e.target.value})}
                                    placeholder="Enter message content..."
                                    className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-3xl px-8 py-6 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500/30 transition-all resize-none leading-relaxed"
                                />
                                <div className="absolute bottom-6 right-6 flex gap-2">
                                    {["name", "email", "phone"].map(v => (
                                        <button 
                                            key={v}
                                            type="button"
                                            onClick={() => setForm({...form, message: form.message + ` {{${v}}}`})}
                                            className="text-[9px] font-black uppercase tracking-tighter bg-white text-slate-500 hover:bg-slate-900 hover:text-white px-2 py-1 rounded-md shadow-sm border border-slate-100 transition-all"
                                        >
                                            + {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Scheduling & Logic */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Audience Card */}
                    <div className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-2xl shadow-indigo-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-white/20">
                                <FiUser size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold tracking-tight">Active Reach</h3>
                                <p className="text-[10px] uppercase font-black tracking-widest text-indigo-200">Broadcast Scoped To {form.audienceType}</p>
                            </div>
                        </div>
                        <p className="text-4xl font-black">{audienceCount}</p>
                        <p className="text-xs text-indigo-100 font-medium mt-2">Verified records found in the current role scope.</p>
                        <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-[.15em]">
                            <span>Status: Ready</span>
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                                Optimal Connectivity
                            </span>
                        </div>
                    </div>

                    {/* Batching & Scheduling */}
                    <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 space-y-8">
                        <div className="space-y-2">
                            <h4 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
                                <FiClock className="text-indigo-600" /> Dispatch Timeline
                            </h4>
                            <p className="text-xs text-slate-400 font-medium italic">Schedule your broadcast for maximum engagement.</p>
                        </div>
                        <input 
                            type="datetime-local"
                            value={form.scheduledAt}
                            onChange={(e) => setForm({...form, scheduledAt: e.target.value})}
                            className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700 outline-none"
                        />

                        <div className="space-y-4 pt-4 border-t border-slate-50">
                            <h4 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
                                <FiSettings className="text-amber-500" /> Logic Protection
                            </h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed italic">Batching controls to ensure delivery hygiene and anti-blocking compliance.</p>
                            
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Size</label>
                                    <input 
                                        type="number"
                                        value={form.batchSize}
                                        onChange={(e) => setForm({...form, batchSize: e.target.value})}
                                        className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-black text-indigo-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Delay (Min)</label>
                                    <input 
                                        type="number"
                                        value={form.delayBetweenBatches}
                                        onChange={(e) => setForm({...form, delayBetweenBatches: e.target.value})}
                                        className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-black text-amber-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex gap-3 text-amber-800">
                             <FiInfo size={28} className="shrink-0 mt-1 opacity-40 shadow-sm" />
                             <div>
                                <p className="font-bold text-[10px] uppercase tracking-widest">Broadcast Warning</p>
                                <p className="text-[11px] font-medium leading-normal mt-0.5 opacity-80 italic">We apply a randomized 2–5 second delay between individual messages as part of our anti-blocking safeguard engine.</p>
                             </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading || audienceCount === 0}
                            className="w-full bg-indigo-600 text-white font-black py-5 rounded-[24px] uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? "Initializing..." : "Launch Run"}
                            {!loading && <FiSend size={16} />}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CampaignFormPage;

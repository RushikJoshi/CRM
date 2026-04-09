import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import { API_BASE_URL } from "../../config/api";
import { useToast } from "../../context/ToastContext";
import { FiPlus, FiRadio, FiClock, FiCheckCircle, FiTrendingUp, FiLayers, FiMessageSquare, FiMail, FiMousePointer } from "react-icons/fi";

const CampaignDashboard = () => {
    const toast = useToast();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCampaigns = useCallback(async () => {
        try {
            const res = await API.get("/mass-messaging");
            setCampaigns(res.data?.data || []);
            setLoading(false);
        } catch {
            toast.error("Failed to load campaigns.");
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        const initialTimer = window.setTimeout(() => {
            void fetchCampaigns();
        }, 0);
        const timer = window.setInterval(fetchCampaigns, 15000);
        return () => {
            window.clearTimeout(initialTimer);
            window.clearInterval(timer);
        };
    }, [fetchCampaigns]);

    const getStatusColor = (status) => {
        switch (status) {
            case "DRAFT": return "bg-gray-100 text-gray-600 border-gray-200";
            case "SCHEDULED": return "bg-blue-50 text-blue-600 border-blue-100";
            case "RUNNING": return "bg-amber-50 text-amber-600 border-amber-100 animate-pulse";
            case "COMPLETED": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "FAILED": return "bg-rose-50 text-rose-600 border-rose-100";
            default: return "bg-slate-50 text-slate-500 border-slate-100";
        }
    };

    const stats = useMemo(() => ({
        total: campaigns.length,
        running: campaigns.filter(c => c.status === "RUNNING").length,
        completed: campaigns.filter(c => c.status === "COMPLETED").length,
        audience: campaigns.reduce((acc, curr) => acc + (curr.recipientMode === "MANUAL" ? (curr.manualRecipients?.length || 0) : (curr.recipients?.length || 0)), 0)
    }), [campaigns]);

    const trackingNeedsPublicUrl = useMemo(
        () => /localhost|127\.0\.0\.1|::1/.test(API_BASE_URL),
        []
    );

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Initializing broadcast engine...</div>;

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4 lg:p-8">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <span className="p-3 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200">
                            <FiRadio size={28} />
                        </span>
                        Mass Messaging
                    </h1>
                    <p className="text-gray-400 font-medium mt-2 max-w-lg">Scale your reach with intelligent batch broadcasting and secure delivery protection.</p>
                </div>
                {/* Visible only for Admin/Manager as per routes but being defensive */}
                <Link 
                    to="create"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-widest"
                >
                    <FiPlus size={18} />
                    Create Campaign
                </Link>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Campaigns", val: stats.total, icon: <FiLayers />, color: "bg-blue-600" },
                    { label: "Currently Running", val: stats.running, icon: <FiClock />, color: "bg-amber-500" },
                    { label: "Completed Runs", val: stats.completed, icon: <FiCheckCircle />, color: "bg-emerald-500" },
                    { label: "Total Audience", val: stats.audience, icon: <FiTrendingUp />, color: "bg-indigo-600" }
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                <p className="text-3xl font-black text-slate-900 leading-none">{s.val}</p>
                            </div>
                            <div className={`${s.color} p-3 rounded-2xl text-white shadow-lg`}>
                                {s.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {trackingNeedsPublicUrl && (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900">
                    <p className="text-[10px] font-black uppercase tracking-widest">Open Tracking Notice</p>
                    <p className="mt-2 font-medium leading-6">
                        Email opens can stay at zero while your API is running on <span className="font-black">localhost</span>. Gmail and similar inboxes fetch tracking images from their own servers, so configure a public server <span className="font-black">TRACKING_BASE_URL</span> ending in <span className="font-black">/api</span> to make open tracking work.
                    </p>
                </div>
            )}

            {/* Campaign Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs tracking-[0.2em]">Live Campaigns & History</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Campaign Name</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Channel</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Audience</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Scheduled For</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Progress</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Engagement</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-40">
                                            <FiRadio size={48} className="mb-4 text-slate-300" />
                                            <p className="font-bold text-slate-500">No campaigns launched yet</p>
                                            <p className="text-xs text-slate-400 mt-1">Ready to scale your communications? Create your first run.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((campaign) => (
                                    <tr key={campaign._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="font-black text-slate-800 text-sm">{campaign.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">ID: {campaign._id.slice(-6)}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`flex items-center gap-2 text-xs font-bold ${campaign.channel === "WHATSAPP" ? "text-green-600" : "text-blue-600"}`}>
                                                {campaign.channel === "WHATSAPP" ? <FiMessageSquare size={14} /> : <FiMail size={14} />}
                                                {campaign.channel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-xs font-black text-slate-700">{(campaign.recipientMode === "MANUAL" ? campaign.manualRecipients?.length : campaign.recipients?.length) || 0} Recipients</div>
                                            {campaign.recipientMode === "MANUAL" && (
                                                <div className="text-[10px] text-amber-500 font-black uppercase tracking-tighter">Manual Emails</div>
                                            )}
                                            <div className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">{campaign.audienceType}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-xs font-bold text-slate-600">{new Date(campaign.scheduledAt).toLocaleDateString()}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase">{new Date(campaign.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-current shadow-sm ${getStatusColor(campaign.status)}`}>
                                                {campaign.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            {(() => {
                                                const totalRecipients = (campaign.recipientMode === "MANUAL" ? campaign.manualRecipients?.length : campaign.recipients?.length) || 0;
                                                const sentCount = campaign.stats?.sent ?? campaign.processedCount ?? 0;
                                                const progress = totalRecipients ? (sentCount / totalRecipients) * 100 : 0;
                                                return (
                                                    <>
                                                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                                                            <div
                                                                className={`h-full bg-indigo-500 transition-all duration-1000 ${campaign.status === "RUNNING" ? "animate-pulse" : ""}`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                            {sentCount} / {totalRecipients} Sent
                                                        </p>
                                                    </>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-black text-sky-600">
                                                    <FiMail size={12} />
                                                    {campaign.stats?.opened || 0} Opened
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-black text-violet-600">
                                                    <FiMousePointer size={12} />
                                                    {campaign.stats?.clicked || 0} Clicked
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400">
                                                    {campaign.stats?.lastOpenedAt ? `Last open ${new Date(campaign.stats.lastOpenedAt).toLocaleString()}` : "No opens yet"}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <Link 
                                                to={`${campaign._id}`}
                                                className="text-xs font-black uppercase text-indigo-600 hover:text-indigo-800 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CampaignDashboard;

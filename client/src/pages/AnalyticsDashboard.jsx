import { useEffect, useState } from "react";
import API from "../services/api";
import { FiTrendingUp, FiCheckCircle, FiXCircle, FiTarget, FiPieChart } from "react-icons/fi";

function AnalyticsDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        try {
            const [leads, deals, conversion] = await Promise.all([
                API.get("/dashboard/leads"),
                API.get("/dashboard/deals"),
                API.get("/dashboard/conversion")
            ]);
            setStats({
                leads: leads.data?.data,
                deals: deals.data?.data,
                conversion: conversion.data?.data
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="h-screen bg-white rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center space-y-4 shadow-sm animate-pulse">
            <div className="w-16 h-16 border-[8px] border-indigo-50 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-[12px]">Generating Analytics Dashboard...</p>
        </div>
    );

    const metrics = [
        { title: "Total Inquiries", value: stats?.conversion?.totalInquiries, icon: FiTarget, color: "text-blue-500 bg-blue-50 border-blue-100" },
        { title: "Total Leads", value: stats?.leads?.totalLeads, icon: FiTrendingUp, color: "text-purple-500 bg-purple-50 border-purple-100" },
        { title: "Conversion Rate", value: `${stats?.conversion?.conversionRate}%`, icon: FiPieChart, color: "text-indigo-500 bg-indigo-50 border-indigo-100" },
        { title: "Deals Won", value: stats?.deals?.dealsWon, icon: FiCheckCircle, color: "text-emerald-500 bg-emerald-50 border-emerald-100" },
        { title: "Deals Lost", value: stats?.deals?.dealsLost, icon: FiXCircle, color: "text-rose-500 bg-rose-50 border-rose-100" }
    ];

    return (
        <div className="space-y-10 animate-in zoom-in-95 fade-in duration-1000 pb-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-12 rounded-[32px] border border-[#E5EAF2] shadow-sm overflow-hidden relative group transition-all">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10">
                    <h1 className="text-4xl lg:text-5xl font-black text-[#1A202C] tracking-tight leading-none mb-3">Revenue Analytics</h1>
                    <p className="text-[#A0AEC0] font-black text-[11px] uppercase tracking-[0.25em] opacity-80">
                        Deep-dive intelligence into conversion metrics & pipeline velocity.
                    </p>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 font-black text-[10px] uppercase tracking-widest">
                        <FiTarget /> Real-time Telemetry
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {metrics.map((m, idx) => (
                    <div key={idx} className="bg-white p-10 rounded-[28px] border border-[#E5EAF2] shadow-sm hover:translate-y-[-8px] transition-all hover:shadow-2xl group duration-500">
                        <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center mb-8 border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${m.color.replace('emerald', 'blue').replace('green', 'indigo')}`}>
                            <m.icon size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-[#A0AEC0] font-black uppercase tracking-widest text-[10px] mb-2">{m.title}</h3>
                        <p className="text-4xl font-black text-[#1A202C] tracking-tight group-hover:text-blue-600 transition-colors">{m.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-12 rounded-[32px] border border-[#E5EAF2] shadow-sm hover:border-blue-200 transition-colors duration-500">
                    <h2 className="text-3xl font-black text-[#1A202C] mb-12 tracking-tight flex items-center gap-4">
                        <FiPieChart className="text-indigo-600" /> Pipeline Efficiency
                    </h2>
                    <div className="space-y-10">
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.2em]">Acquisition Velocity</span>
                                <span className="text-xl font-black text-[#1A202C]">{stats?.leads?.newLeads} <span className="text-[11px] text-[#A0AEC0] font-extrabold ml-1">NEW</span></span>
                            </div>
                            <div className="h-4 bg-[#F4F7FB] rounded-full overflow-hidden border border-[#E5EAF2] p-1">
                                <div
                                    className="h-full bg-blue-600 rounded-full shadow-lg shadow-blue-200 transition-all duration-1000 ease-out"
                                    style={{ width: `${(stats?.leads?.newLeads / stats?.leads?.totalLeads) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-[11px] font-black text-[#718096] uppercase tracking-[0.2em]">Conversion Potential</span>
                                <span className="text-xl font-black text-blue-600">{stats?.leads?.hotLeads} <span className="text-[11px] text-[#A0AEC0] font-extrabold ml-1">HIGH SCORE</span></span>
                            </div>
                            <div className="h-4 bg-[#F4F7FB] rounded-full overflow-hidden border border-[#E5EAF2] p-1">
                                <div
                                    className="h-full bg-indigo-500 rounded-full shadow-lg shadow-indigo-200 transition-all duration-1000 ease-out"
                                    style={{ width: `${(stats?.leads?.hotLeads / stats?.leads?.totalLeads) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-12 rounded-[32px] border border-[#E5EAF2] shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all duration-500">
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-30 -mr-24 -mb-24 transition-all group-hover:scale-125 duration-1000" />
                    <h2 className="text-3xl font-black text-[#1A202C] mb-12 tracking-tight flex items-center gap-4">
                        <FiCheckCircle className="text-blue-600" /> Success Metrics
                    </h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="p-10 bg-blue-50 rounded-[28px] border border-blue-100 shadow-sm flex flex-col items-center group/card transition-all hover:bg-white hover:shadow-xl hover:-translate-y-2">
                            <FiCheckCircle size={40} className="text-blue-600 mb-6 group-hover/card:scale-110 transition-transform" />
                            <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-2">Deals Secured</h4>
                            <p className="text-5xl font-black text-blue-700">{stats?.deals?.dealsWon}</p>
                        </div>
                        <div className="p-10 bg-slate-50 rounded-[28px] border border-[#E5EAF2] shadow-sm flex flex-col items-center group/card transition-all hover:bg-white hover:shadow-xl hover:-translate-y-2">
                            <FiXCircle size={40} className="text-[#A0AEC0] mb-6 group-hover/card:scale-110 transition-transform" />
                            <h4 className="text-[11px] font-black text-[#718096] uppercase tracking-widest mb-2">Lost Records</h4>
                            <p className="text-5xl font-black text-[#1A202C]">{stats?.deals?.dealsLost}</p>
                        </div>
                    </div>
                    <div className="mt-10 p-12 bg-[#F4F7FB]/50 rounded-[28px] border border-[#E5EAF2] border-dashed text-center group-hover:bg-white group-hover:border-blue-200 transition-all duration-500">
                        <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.25em] mb-4">Estimated Pipeline Asset Value</p>
                        <p className="text-5xl font-black text-[#1A202C] tracking-tight group-hover:text-blue-600 transition-colors">₹ {(stats?.deals?.totalDeals * 1500).toLocaleString()}+</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsDashboard;

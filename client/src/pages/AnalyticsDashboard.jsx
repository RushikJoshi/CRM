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
            <div className="w-16 h-16 border-[8px] border-teal-50 border-t-teal-600 rounded-full animate-spin" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-[12px]">Generating Analytics Dashboard...</p>
        </div>
    );

    const metrics = [
        { title: "Total Inquiries", value: stats?.conversion?.totalInquiries, icon: FiTarget, color: "text-teal-600 bg-teal-50 border-teal-100" },
        { title: "Total Leads", value: stats?.leads?.totalLeads, icon: FiTrendingUp, color: "text-purple-500 bg-purple-50 border-purple-100" },
        { title: "Conversion Rate", value: `${stats?.conversion?.conversionRate}%`, icon: FiPieChart, color: "text-teal-600 bg-teal-50 border-teal-100" },
        { title: "Deals Won", value: stats?.deals?.dealsWon, icon: FiCheckCircle, color: "text-emerald-500 bg-emerald-50 border-emerald-100" },
        { title: "Deals Lost", value: stats?.deals?.dealsLost, icon: FiXCircle, color: "text-rose-500 bg-rose-50 border-rose-100" }
    ];

    return (
        <div className="space-y-6 md:space-y-10 animate-in zoom-in-95 fade-in duration-1000 pb-12 md:pb-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 md:p-10 lg:p-12 rounded-2xl md:rounded-[32px] border border-[#E5EAF2] shadow-sm overflow-hidden relative group transition-all">
                <div className="absolute top-0 right-0 w-80 h-80 bg-teal-600/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A202C] tracking-tight leading-tight mb-3">Revenue Analytics</h1>
                    <p className="text-[#A0AEC0] font-black text-[11px] uppercase tracking-[0.25em] opacity-80">
                        Deep-dive intelligence into conversion metrics & pipeline velocity.
                    </p>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 px-6 py-3 bg-teal-50 border border-teal-100 rounded-2xl text-teal-700 font-black text-[10px] uppercase tracking-widest">
                        <FiTarget /> Real-time Telemetry
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {metrics.map((m, idx) => (
                    <div key={idx} className="bg-white p-6 md:p-8 lg:p-10 rounded-2xl md:rounded-[28px] border border-[#E5EAF2] shadow-sm hover:translate-y-[-8px] transition-all hover:shadow-2xl group duration-500">
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[22px] flex items-center justify-center mb-6 md:mb-8 border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${m.color.replace('emerald', 'blue').replace('green', 'indigo')}`}>
                            <m.icon className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />
                        </div>
                        <h3 className="text-[#A0AEC0] font-black uppercase tracking-widest text-[9px] md:text-[10px] mb-2">{m.title}</h3>
                        <p className="text-3xl md:text-4xl font-black text-[#1A202C] tracking-tight group-hover:text-teal-700 transition-colors">{m.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-10">
                <div className="bg-white p-6 md:p-10 lg:p-12 rounded-2xl md:rounded-[32px] border border-[#E5EAF2] shadow-sm hover:border-teal-200 transition-colors duration-500">
                    <h2 className="text-2xl md:text-3xl font-black text-[#1A202C] mb-8 md:mb-12 tracking-tight flex items-center gap-4">
                        <FiPieChart className="text-teal-700 shrink-0" /> Pipeline Efficiency
                    </h2>
                    <div className="space-y-8 md:space-y-10">
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.2em]">Acquisition Velocity</span>
                                <span className="text-xl font-black text-[#1A202C]">{stats?.leads?.newLeads} <span className="text-[11px] text-[#A0AEC0] font-extrabold ml-1">NEW</span></span>
                            </div>
                            <div className="h-4 bg-[#F4F7FB] rounded-full overflow-hidden border border-[#E5EAF2] p-1">
                                <div
                                    className="h-full bg-teal-700 rounded-full shadow-lg shadow-teal-200 transition-all duration-1000 ease-out"
                                    style={{ width: `${(stats?.leads?.newLeads / stats?.leads?.totalLeads) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-[11px] font-black text-[#718096] uppercase tracking-[0.2em]">Conversion Potential</span>
                                <span className="text-xl font-black text-teal-700">{stats?.leads?.hotLeads} <span className="text-[11px] text-[#A0AEC0] font-extrabold ml-1">HIGH SCORE</span></span>
                            </div>
                            <div className="h-4 bg-[#F4F7FB] rounded-full overflow-hidden border border-[#E5EAF2] p-1">
                                <div
                                    className="h-full bg-teal-600 rounded-full shadow-lg shadow-teal-200 transition-all duration-1000 ease-out"
                                    style={{ width: `${(stats?.leads?.hotLeads / stats?.leads?.totalLeads) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-10 lg:p-12 rounded-2xl md:rounded-[32px] border border-[#E5EAF2] shadow-sm relative overflow-hidden group hover:border-teal-200 transition-all duration-500">
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-600/5 rounded-full blur-3xl opacity-30 -mr-24 -mb-24 transition-all group-hover:scale-125 duration-1000" />
                    <h2 className="text-2xl md:text-3xl font-black text-[#1A202C] mb-8 md:mb-12 tracking-tight flex items-center gap-4">
                        <FiCheckCircle className="text-teal-700 shrink-0" /> Success Metrics
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                        <div className="p-6 md:p-10 bg-teal-50 rounded-2xl md:rounded-[28px] border border-teal-100 shadow-sm flex flex-col items-center group/card transition-all hover:bg-white hover:shadow-xl hover:-translate-y-2">
                            <FiCheckCircle className="w-8 h-8 md:w-10 md:h-10 text-teal-700 mb-4 md:mb-6 group-hover/card:scale-110 transition-transform" />
                            <h4 className="text-[10px] md:text-[11px] font-black text-teal-700 uppercase tracking-widest mb-2 text-center">Deals Secured</h4>
                            <p className="text-4xl md:text-5xl font-black text-teal-800">{stats?.deals?.dealsWon}</p>
                        </div>
                        <div className="p-6 md:p-10 bg-slate-50 rounded-2xl md:rounded-[28px] border border-[#E5EAF2] shadow-sm flex flex-col items-center group/card transition-all hover:bg-white hover:shadow-xl hover:-translate-y-2">
                            <FiXCircle className="w-8 h-8 md:w-10 md:h-10 text-[#A0AEC0] mb-4 md:mb-6 group-hover/card:scale-110 transition-transform" />
                            <h4 className="text-[10px] md:text-[11px] font-black text-[#718096] uppercase tracking-widest mb-2 text-center">Lost Records</h4>
                            <p className="text-4xl md:text-5xl font-black text-[#1A202C]">{stats?.deals?.dealsLost}</p>
                        </div>
                    </div>
                    <div className="mt-8 md:mt-10 p-6 md:p-12 bg-[#F4F7FB]/50 rounded-2xl md:rounded-[28px] border border-[#E5EAF2] border-dashed text-center group-hover:bg-white group-hover:border-teal-200 transition-all duration-500">
                        <p className="text-[10px] md:text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.25em] mb-4">Estimated Pipeline Asset Value</p>
                        <p className="text-3xl md:text-5xl font-black text-[#1A202C] tracking-tight group-hover:text-teal-700 transition-colors">₹ {(stats?.deals?.totalDeals * 1500).toLocaleString()}+</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsDashboard;

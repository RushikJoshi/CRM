import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import API from "../services/api";
import { FiTrendingUp, FiCheckCircle, FiTarget, FiUser } from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";

const Reports = () => {
    const [revenue, setRevenue] = useState([]);
    const [stages, setStages] = useState([]);
    const [conversions, setConversions] = useState({ total: 0, converted: 0 });
    const [performance, setPerformance] = useState([]);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        try {
            const [rev, stg, conv, perf, fore] = await Promise.all([
                API.get("/reports/revenue"),
                API.get("/reports/deals-by-stage"),
                API.get("/reports/lead-conversions"),
                API.get("/reports/user-performance"),
                API.get("/reports/deal-forecasting")
            ]);
            setRevenue((rev.data?.data || rev.data).map(d => ({ name: `Month ${d._id}`, value: d.revenue })));
            setStages((stg.data?.data || stg.data).map(d => ({ name: d._id?.replace('_', ' ') || 'Unknown', value: d.count })));
            setConversions(conv.data?.data || conv.data);
            setPerformance((perf.data?.data || perf.data).map(d => ({ name: d._id?.name || "AI Agent", value: d.totalValue })));
            setForecast((fore.data?.data || fore.data).map(d => ({ name: d.stage, weighted: Math.round(d.weightedValue), actual: Math.round(d.actualValue) })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    if (loading) return <div className="h-[70vh] flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.2em] animate-pulse">Loading...</div>;

    const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-20">
            {/* Header Block */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-50/30 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Business Reports</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 opacity-60">See how your business is doing.</p>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="px-5 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Time Period</p>
                        <p className="text-sm font-black text-gray-900">Current Period: Q1-2024</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">

                {/* Revenue Evolution Curve */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-green-100/50 transition-all group overflow-hidden relative">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-green-50 text-green-600 rounded-[1.25rem] shadow-sm"><FiTrendingUp size={24} /></div>
                            <div>
                                <h3 className="text-xl font-black text-gray-800 tracking-tight">Revenue</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Your revenue</p>
                            </div>
                        </div>
                        <span className="text-2xl font-black text-green-600">₹{revenue.reduce((a, b) => a + b.value, 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-72 sm:h-96 w-full -mx-4">
                        {revenue.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenue}>
                                    <defs>
                                        <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f8fafc" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} hide />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} hide />
                                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px' }} />
                                    <Area type="monotone" dataKey="value" stroke="#22c55e" fillOpacity={1} fill="url(#colorGreen)" strokeWidth={5} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-300 font-bold italic">No data found.</div>}
                    </div>
                </div>

                {/* Pipeline Weight Analysis */}
                <div className="bg-gray-900 p-10 rounded-[3.5rem] shadow-2xl group relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none"></div>
                    <div className="flex items-center gap-4 mb-10 relative z-10">
                        <div className="p-3.5 bg-white/10 text-white rounded-[1.25rem] backdrop-blur-md"><FiTarget size={24} /></div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Deals by Stage</h3>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5 whitespace-nowrap">Deal stages</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full flex flex-col sm:flex-row items-center justify-between gap-12 relative z-10 pb-4">
                        <div className="flex-1 w-full h-72 sm:h-96 min-w-[240px]">
                            {stages.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stages}
                                            cx="50%" cy="50%"
                                            innerRadius={70} outerRadius={110}
                                            paddingAngle={8} dataKey="value"
                                            stroke="none"
                                        >
                                            {stages.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#22c55e', '#16a34a', '#86efac', '#bbf7d0', '#f0fdf4'][index % 5]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#000', border: 'none', color: '#fff', borderRadius: '24px', padding: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-gray-700 font-bold italic uppercase tracking-widest text-xs">No active deals.</div>}
                        </div>
                        <div className="flex flex-col gap-6 w-full sm:w-auto min-w-[140px]">
                            {stages.map((s, i) => (
                                <div key={i} className="flex items-center justify-between gap-6 border-b border-white/5 pb-2 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: ['#22c55e', '#16a34a', '#86efac', '#bbf7d0', '#f0fdf4'][i % 5] }} />
                                        <span className="text-[11px] font-black text-gray-400 capitalize tracking-tight whitespace-nowrap">{s.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-white">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Acquisition Conversion Matrix */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center gap-12 xl:col-span-2">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-green-50 text-green-600 rounded-[1.25rem]"><FiCheckCircle size={24} /></div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Leads to Customers</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Conversion rate</p>
                            </div>
                        </div>
                        <p className="text-gray-500 font-bold text-sm leading-relaxed max-w-md">This shows how many of your leads turned into paying customers during this period.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-inner">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Leads</p>
                                <p className="text-3xl font-black text-gray-900">{conversions.total}</p>
                            </div>
                            <div className="p-6 bg-green-50 rounded-[2rem] border border-green-100">
                                <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">New Customers</p>
                                <p className="text-3xl font-black text-green-600">{conversions.converted}</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r="42%" stroke="#f8fafc" strokeWidth="22" fill="none" />
                            <circle cx="50%" cy="50%" r="42%" stroke="#22c55e" strokeWidth="22" fill="none" strokeDasharray="264 264" strokeDashoffset={264 - (conversions.total ? (conversions.converted / conversions.total) * 264 : 0)} className="transition-all duration-1000" strokeLinecap="round" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-5xl font-black text-gray-900">{conversions.total ? Math.round((conversions.converted / conversions.total) * 100) : 0}%</span>
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Success Rate</span>
                        </div>
                    </div>
                </div>

                {/* Node Performance Matrix */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm xl:col-span-2 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="p-3.5 bg-gray-900 text-white rounded-[1.25rem]"><FiUser size={24} /></div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Team Performance</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Member performance</p>
                        </div>
                    </div>
                    <div className="h-96 w-full -ml-8">
                        {performance.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performance} layout="vertical" margin={{ left: 20, right: 40 }}>
                                    <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" tick={{ fill: '#1f2937', fontWeight: 900, fontSize: 11 }} width={140} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '24px', border: 'none', background: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="value" fill="#22c55e" radius={[0, 20, 20, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-300 font-bold italic uppercase tracking-widest text-xs">No data to show yet.</div>}
                    </div>
                </div>

                {/* Deal Revenue Forecasting */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm xl:col-span-2 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="p-3.5 bg-green-50 text-green-600 rounded-[1.25rem]"><FiTrendingUp size={24} /></div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Future Revenue</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Expected revenue</p>
                        </div>
                        <div className="ml-auto flex items-center gap-6 text-xs font-black">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-green-500" /><span className="text-gray-400">Predicted</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-gray-200" /><span className="text-gray-400">Current</span></div>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        {forecast.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={forecast} margin={{ left: 0, right: 20 }}>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} />
                                    <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '16px', border: 'none', background: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.12)' }} />
                                    <Bar dataKey="actual" fill="#e2e8f0" radius={[8, 8, 0, 0]} barSize={24} />
                                    <Bar dataKey="weighted" fill="#22c55e" radius={[8, 8, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-300 font-bold italic uppercase tracking-widest text-xs">No deals in the pipeline.</div>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Reports;

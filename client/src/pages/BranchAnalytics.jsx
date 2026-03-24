import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import { getCurrentUser } from "../context/AuthContext";
import {
    FiTrendingUp, FiAward, FiPhone, FiCalendar,
    FiRefreshCw, FiUsers, FiTarget, FiZap,
    FiChevronDown, FiChevronUp
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";

// ── Simple Bar Component ──────────────────────────────────────────────────────
const Bar = ({ value, max, color = "bg-green-500", height = "h-2.5" }) => (
    <div className={`w-full bg-gray-100 rounded-full ${height} overflow-hidden`}>
        <div
            className={`${height} ${color} rounded-full transition-all duration-1000 ease-out`}
            style={{ width: max > 0 ? `${Math.min(100, (value / max) * 100)}%` : "0%" }}
        />
    </div>
);

// ── Funnel Stage Bar ──────────────────────────────────────────────────────────
const FunnelBar = ({ stage, count, max, color }) => (
    <div className="flex items-center gap-4">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-24 shrink-0">{stage}</span>
        <div className="flex-1 bg-gray-50 rounded-full h-6 overflow-hidden border border-gray-100 relative">
            <div
                className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-1000"
                style={{ width: max > 0 ? `${Math.max(4, (count / max) * 100)}%` : "4%", backgroundColor: color }}
            >
                <span className="text-white text-[9px] font-black">{count}</span>
            </div>
        </div>
        <span className="text-sm font-black text-gray-900 w-10 text-right">{count}</span>
    </div>
);

// ── Revenue Trend Bars ────────────────────────────────────────────────────────
const TrendChart = ({ data }) => {
    const max = Math.max(...data.map(d => d.revenue), 1);
    return (
        <div className="flex items-end gap-2 h-32">
            {data.map((d, i) => {
                const h = Math.max(4, (d.revenue / max) * 100);
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="relative w-full flex justify-center">
                            <div
                                className="w-full bg-green-500 rounded-t-lg transition-all duration-700 hover:bg-green-400 cursor-pointer"
                                style={{ height: `${h}%`, minHeight: "4px" }}
                            />
                            <div className="absolute -top-8 bg-gray-900 text-white text-[9px] font-black py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">
                                ₹{(d.revenue / 100000).toFixed(1)}L
                            </div>
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide">{d.month}</span>
                    </div>
                );
            })}
        </div>
    );
};

// ── Source Donut (CSS-based) ──────────────────────────────────────────────────
const COLORS = ["#22c55e", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"];
const SourcePie = ({ data }) => {
    const total = data.reduce((a, b) => a + b.count, 0);
    return (
        <div className="space-y-3">
            {data.slice(0, 6).map((s, i) => (
                <div key={s.source} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-gray-700 truncate">{s.source || "Unknown"}</span>
                            <span className="text-xs font-black text-gray-500">{total > 0 ? Math.round((s.count / total) * 100) : 0}%</span>
                        </div>
                        <Bar value={s.count} max={total} color={`bg-[${COLORS[i % COLORS.length]}]`} height="h-1.5" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
const BranchAnalyticsPage = () => {
    const user = getCurrentUser() || {};
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const formatINR = (n) => {
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
        if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
        return `₹${n}`;
    };

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await API.get("/branch-analytics");
            setData(res.data?.data || null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 border-[6px] border-green-100 border-t-green-500 rounded-full animate-spin" />
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em]">Loading Branch Analytics...</p>
        </div>
    );

    const kpis = data?.kpis || {};
    const funnel = data?.funnel || [];
    const revenueTrend = data?.revenueTrend || [];
    const sourceBreakdown = data?.sourceBreakdown || [];
    const statusDist = data?.statusDistribution || [];
    const pipeline = data?.pipelineByStage || [];

    const funnelMax = funnel[0]?.count || 1;
    const pipelineTotal = pipeline.reduce((a, b) => a + b.value, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            {/* ── HEADER ─────────────────────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-green-500/10 rounded-full blur-[80px]" />
                    <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-teal-600/10 rounded-full blur-[60px]" />
                </div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-8 bg-green-400 rounded-full" />
                            <p className="text-green-400 text-[10px] font-black uppercase tracking-[0.3em]">Branch Intelligence</p>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight">Analytics Command Center</h1>
                        <p className="text-gray-400 text-sm mt-2">{user.role === "branch_manager" ? "Real-time performance data for your branch." : "Company-wide analytics view."}</p>
                    </div>
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all"
                    >
                        <FiRefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {/* KPI Strip */}
                <div className="relative z-10 grid grid-cols-2 md:grid-cols-5 gap-4 mt-10">
                    {[
                        { label: "This Month Leads", value: kpis.monthLeads, icon: <FiTarget size={16} />, accent: "text-teal-500" },
                        { label: "Deals Closed", value: kpis.monthDeals, icon: <FiAward size={16} />, accent: "text-yellow-400" },
                        { label: "Revenue", value: formatINR(kpis.monthRevenue || 0), icon: <FaIndianRupeeSign size={14} />, accent: "text-green-400" },
                        { label: "Calls Made", value: kpis.monthCalls, icon: <FiPhone size={16} />, accent: "text-orange-400" },
                        { label: "Win Rate", value: `${kpis.conversionRate || 0}%`, icon: <FiTrendingUp size={16} />, accent: "text-emerald-400" },
                    ].map(({ label, value, icon, accent }) => (
                        <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all">
                            <div className={`${accent} mb-2`}>{icon}</div>
                            <p className="text-2xl font-black tracking-tight">{value ?? "—"}</p>
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── ROW 1: Funnel + Revenue Trend ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Conversion Funnel */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-gray-900">Conversion Funnel</h2>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">All Time</span>
                    </div>
                    <div className="space-y-4">
                        {funnel.map((f) => (
                            <FunnelBar key={f.stage} {...f} max={funnelMax} />
                        ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Win Rate</span>
                        <span className="text-2xl font-black text-green-600">{kpis.conversionRate}%</span>
                    </div>
                </div>

                {/* Revenue Trend */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-gray-900">Revenue Trend</h2>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">6 Months</span>
                    </div>
                    {revenueTrend.length > 0 ? (
                        <>
                            <TrendChart data={revenueTrend} />
                            <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-50">
                                {revenueTrend.slice(-3).map(d => (
                                    <div key={d.month} className="text-center">
                                        <p className="text-sm font-black text-gray-900">{formatINR(d.revenue)}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{d.month}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-32 flex items-center justify-center text-gray-300 text-sm">No revenue data yet.</div>
                    )}
                </div>
            </div>

            {/* ── ROW 2: Lead Sources + Status Distribution ─────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lead Sources */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-gray-900">Lead Sources</h2>
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                            {sourceBreakdown.reduce((a, b) => a + b.count, 0)} Total
                        </span>
                    </div>
                    {sourceBreakdown.length > 0 ? (
                        <div className="space-y-4">
                            {sourceBreakdown.map((s, i) => {
                                const total = sourceBreakdown.reduce((a, b) => a + b.count, 0);
                                return (
                                    <div key={s.source} className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-bold text-gray-700 truncate">{s.source || "Unknown"}</span>
                                                <span className="text-sm font-black text-gray-900">{s.count}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-2 rounded-full transition-all duration-700"
                                                    style={{ width: `${(s.count / total) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-gray-300 text-center py-10 text-sm">No data available.</p>}
                </div>

                {/* Lead Status Distribution */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-gray-900">Lead Status Mix</h2>
                    </div>
                    {statusDist.length > 0 ? (
                        <div className="space-y-4">
                            {statusDist.slice(0, 7).map((s, i) => {
                                const total = statusDist.reduce((a, b) => a + b.count, 0);
                                return (
                                    <div key={s.status} className="space-y-1">
                                        <div className="flex justify-between text-xs font-black">
                                            <span className="text-gray-600 uppercase tracking-widest">{s.status}</span>
                                            <span className="text-gray-900">{s.count} ({Math.round((s.count / total) * 100)}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-2 rounded-full transition-all duration-1000"
                                                style={{ width: `${(s.count / total) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-gray-300 text-center py-10 text-sm">No data available.</p>}
                </div>
            </div>

            {/* ── ROW 3: Pipeline Value by Stage ────────────────────────────── */}
            {pipeline.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-gray-900">Active Pipeline by Stage</h2>
                        <span className="text-green-600 font-black text-lg">{formatINR(pipelineTotal)}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {pipeline.map((p, i) => (
                            <div key={p.stage} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-black mb-4 shadow"
                                    style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                                    {p.count}
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{p.stage}</p>
                                <p className="text-2xl font-black text-gray-900">{formatINR(p.value)}</p>
                                <Bar value={p.value} max={pipelineTotal} color="bg-green-500" height="h-1.5" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchAnalyticsPage;

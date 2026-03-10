import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import { getCurrentUser } from "../context/AuthContext";
import {
    FiClock, FiPhone, FiCalendar, FiCheckCircle,
    FiAlertCircle, FiStar, FiChevronRight, FiRefreshCw,
    FiTrendingUp, FiCheckSquare, FiAlertTriangle
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";

// ── Shared Components ────────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden ${className}`}>
        {children}
    </div>
);

const SectionTitle = ({ icon, title, count, accent }) => (
    <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${accent} bg-opacity-10`}>
                {icon}
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
        </div>
        {count !== undefined && (
            <span className="px-3 py-1 bg-gray-50 border border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-full">
                {count} Items
            </span>
        )}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const SalesPlanner = () => {
    const user = getCurrentUser() || {};
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const [plannerRes, statsRes] = await Promise.all([
                API.get("/planner/today"),
                API.get("/planner/stats")
            ]);
            setData(plannerRes.data?.data);
            setStats(statsRes.data?.data);
        } catch (err) {
            console.error("Planner load error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 border-[6px] border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em]">Preparing your agenda...</p>
        </div>
    );

    const agenda = data?.agenda || { calls: [], meetings: [] };
    const tasks = data?.tasks || [];
    const staleLeads = data?.staleLeads || [];
    const plannerStats = data?.stats || {};

    const formatTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";
    const formatINR = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString()}`;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">

            {/* ── HERO HEADER ────────────────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <FiCalendar size={200} />
                </div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
                            <span className="text-emerald-100 text-[10px] font-black uppercase tracking-widest">Live Agenda</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tighter">Good morning, {user.name?.split(' ')[0]}!</h1>
                        <p className="text-emerald-50 text-sm mt-3 opacity-80 max-w-lg font-medium leading-relaxed">
                            You have <span className="text-white font-bold">{plannerStats.totalPending} items</span> on your plate today.
                            Let's crush those targets! 🚀
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-center min-w-[120px]">
                            <p className="text-3xl font-black">{stats?.conversionRate}%</p>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Conv. Rate</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-center min-w-[120px]">
                            <p className="text-3xl font-black">{formatINR(stats?.revenue || 0)}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Revenue</p>
                        </div>
                        <button
                            onClick={() => fetchData(true)}
                            className="bg-white text-emerald-600 p-5 rounded-3xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                        >
                            <FiRefreshCw size={24} className={refreshing ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── GRID LAYOUT ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: Today's Action Agenda (Calls & Meetings) */}
                <div className="lg:col-span-8 space-y-8">
                    <div>
                        <SectionTitle
                            icon={<FiClock size={20} className="text-blue-500" />}
                            title="Command Center: Actions"
                            accent="bg-blue-500"
                            count={agenda.calls.length + agenda.meetings.length}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[...agenda.calls, ...agenda.meetings].sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).map((item, idx) => {
                                const isCall = item.type === undefined ? (item.location ? false : true) : item.location === undefined;
                                // Simple check: Calls don't have location in our schema
                                const isMeeting = item.location !== undefined;

                                return (
                                    <Card key={idx} className="group hover:border-emerald-300 transition-all cursor-pointer">
                                        <div className="p-6 flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-2.5 rounded-xl ${isMeeting ? "bg-indigo-50 text-indigo-600" : "bg-green-50 text-green-600"}`}>
                                                    {isMeeting ? <FiCalendar size={18} /> : <FiPhone size={18} />}
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                                    {formatTime(item.startDate)}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-gray-900 text-lg mb-1 group-hover:text-emerald-600 transition-colors truncate">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                                With: {item.leadId?.name || "Unknown Lead"}
                                            </p>
                                            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${item.status === 'Scheduled' ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`} />
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.status}</span>
                                                </div>
                                                <FiChevronRight className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" size={20} />
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                            {(agenda.calls.length + agenda.meetings.length === 0) && (
                                <div className="col-span-full py-16 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                                    <FiStar className="mx-auto text-gray-200 mb-4" size={40} />
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No actions scheduled for today</p>
                                    <p className="text-gray-300 text-[10px] mt-2 font-bold">Good time to prospect new leads!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pending Tasks Section */}
                    <div>
                        <SectionTitle
                            icon={<FiCheckSquare size={20} className="text-orange-500" />}
                            title="Tasks & Reminders"
                            accent="bg-orange-500"
                            count={tasks.length}
                        />
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <div key={task._id} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className={`p-3 rounded-2xl ${task.priority === 'High' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                                            <FiAlertCircle size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-800 text-sm tracking-tight">{task.title}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${task.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {task.priority} Priority
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                                        <FiCheckCircle size={18} />
                                    </button>
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <div className="py-10 text-center text-gray-300 font-black uppercase tracking-widest text-[10px]">
                                    All caught up on tasks!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Stale Leads & Motivation */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Stale Leads Card */}
                    <Card className="p-8">
                        <SectionTitle
                            icon={<FiAlertTriangle size={20} className="text-red-500" />}
                            title="Needs Attention"
                            accent="bg-red-500"
                        />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 leading-relaxed">
                            These leads haven't had activity in 3+ days. Reconnect now to prevent churn.
                        </p>
                        <div className="space-y-4">
                            {staleLeads.map((lead) => (
                                <div key={lead._id} className="group p-4 bg-gray-50 hover:bg-white border border-transparent hover:border-emerald-100 rounded-2xl transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-black text-gray-900 text-sm">{lead.name}</p>
                                        <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Stale</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-gray-200 h-1 rounded-full overflow-hidden">
                                            <div className="bg-red-400 h-full w-[80%]" />
                                        </div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase">3+ Days</span>
                                    </div>
                                    <Link to={`/sales/leads`} className="mt-3 block text-center py-2 bg-white border border-gray-200 text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500 hover:text-white hover:border-emerald-500">
                                        Contact Now
                                    </Link>
                                </div>
                            ))}
                            {staleLeads.length === 0 && (
                                <div className="text-center py-6">
                                    <p className="text-gray-300 font-black uppercase tracking-widest text-[9px]">Your pipeline is fresh! ✨</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Performance Pulse */}
                    <Card className="bg-gray-900 text-white p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <FiTrendingUp size={120} />
                        </div>
                        <h3 className="font-black text-lg mb-6 flex items-center gap-3">
                            <FiTrendingUp className="text-emerald-400" />
                            Monthly Pulse
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Converted Deals</span>
                                    <span className="text-xs font-black">{stats?.convertedCount} Deals</span>
                                </div>
                                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-400 h-full transition-all duration-1000" style={{ width: `${stats?.conversionRate}%` }} />
                                </div>
                            </div>
                            <div className="pt-6 border-t border-white/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                                        <FiStar size={24} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black">{stats?.leadsCount}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50">New Leads</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SalesPlanner;

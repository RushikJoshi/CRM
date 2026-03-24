import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import { getCurrentUser } from "../context/AuthContext";
import {
    FiAward, FiTrendingUp, FiPhone, FiCalendar,
    FiUsers, FiRefreshCw, FiZap, FiCheckCircle, FiAlertCircle
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";

// ── Rank Medal ───────────────────────────────────────────────────────────────
const Medal = ({ rank }) => {
    if (rank === 1) return <span className="text-3xl">🥇</span>;
    if (rank === 2) return <span className="text-3xl">🥈</span>;
    if (rank === 3) return <span className="text-3xl">🥉</span>;
    return (
        <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 font-black text-lg">
            {rank}
        </div>
    );
};

// ── Stat Pill ─────────────────────────────────────────────────────────────────
const Stat = ({ icon, label, value, accent }) => (
    <div className="flex flex-col items-center text-center">
        <span className={`text-lg mb-1 ${accent}`}>{icon}</span>
        <p className="text-sm font-black text-gray-900">{value ?? 0}</p>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const LeaderboardPage = () => {
    const user = getCurrentUser() || {};
    const role = user.role;
    const isMgr = role === "branch_manager" || role === "company_admin";

    const [leaderboard, setLeaderboard] = useState([]);
    const [assignStatus, setAssignStatus] = useState(null);
    const [month, setMonth] = useState("");
    const [loading, setLoading] = useState(true);
    const [redistributing, setRedistributing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showAutoAssign, setShowAutoAssign] = useState(false);

    const formatINR = (n) => {
        if (!n) return "₹0";
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
        if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
        return `₹${n}`;
    };

    const fetchAll = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const [lbRes, asRes] = await Promise.all([
                API.get("/branch-analytics/leaderboard"),
                API.get("/branch-analytics/auto-assign/status")
            ]);
            setLeaderboard(lbRes.data?.data || []);
            setMonth(lbRes.data?.month || "");
            setAssignStatus(asRes.data?.data || null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleRedistribute = async () => {
        if (!window.confirm("This will evenly distribute all unassigned leads across your team using Round Robin. Continue?")) return;
        setRedistributing(true);
        try {
            const res = await API.post("/branch-analytics/auto-assign/redistribute");
            alert(`✅ ${res.data.message}`);
            fetchAll();
        } catch (err) {
            alert("Error: " + (err.response?.data?.message || "Failed to redistribute."));
        } finally {
            setRedistributing(false);
        }
    };

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 border-[6px] border-green-100 border-t-green-500 rounded-full animate-spin" />
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em]">Building Leaderboard...</p>
        </div>
    );

    const maxScore = leaderboard[0]?.score || 1;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">

            {/* ── HEADER ──────────────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-2 h-10 bg-yellow-400 rounded-full shadow-lg shadow-yellow-100" />
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Team Leaderboard</h1>
                    </div>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest pl-5">
                        {month} — Live performance ranking
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchAll(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-5 py-3 bg-gray-50 border border-gray-100 text-gray-700 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                    >
                        <FiRefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    {isMgr && (
                        <button
                            onClick={() => setShowAutoAssign(p => !p)}
                            className="flex items-center gap-2 px-5 py-3 bg-teal-600 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-teal-700 shadow-lg shadow-teal-100 transition-all"
                        >
                            <FiZap size={14} /> Auto Assign
                            {showAutoAssign ? <FiCheckCircle size={14} /> : null}
                        </button>
                    )}
                </div>
            </div>

            {/* ── AUTO-ASSIGNMENT PANEL ────────────────────────────────────────── */}
            {isMgr && showAutoAssign && assignStatus && (
                <div className="bg-gradient-to-br from-teal-50 to-teal-50 border border-teal-100 rounded-[2rem] p-8 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <FiZap className="text-teal-700" size={20} />
                                <h2 className="text-xl font-black text-teal-900">Auto Round-Robin Assignment</h2>
                            </div>
                            <p className="text-teal-700 text-sm font-medium">
                                {assignStatus.unassignedLeads > 0
                                    ? `⚠️ ${assignStatus.unassignedLeads} leads are unassigned and waiting for distribution.`
                                    : "✅ All leads are currently assigned to team members."}
                            </p>
                        </div>
                        <button
                            onClick={handleRedistribute}
                            disabled={redistributing || assignStatus.unassignedLeads === 0}
                            className="flex items-center gap-2 px-8 py-4 bg-teal-700 text-white font-black rounded-xl shadow-xl shadow-teal-200 hover:bg-teal-700 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                            <FiZap size={16} />
                            {redistributing ? "Distributing..." : `Distribute ${assignStatus.unassignedLeads} Leads`}
                        </button>
                    </div>

                    {/* Rep Workload Table */}
                    <div className="bg-white rounded-2xl border border-teal-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Workload Distribution</p>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {assignStatus.reps?.map((rep, i) => {
                                const maxLeads = Math.max(...assignStatus.reps.map(r => r.activeLeads), 1);
                                const isOverloaded = rep.activeLeads > maxLeads * 0.8 && rep.activeLeads > 5;
                                return (
                                    <div key={rep._id} className="px-6 py-4 flex items-center gap-4">
                                        <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">
                                            {rep.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between mb-1">
                                                <p className="text-sm font-black text-gray-900 truncate">{rep.name}</p>
                                                <span className={`text-xs font-black ${isOverloaded ? "text-red-500" : "text-green-600"}`}>
                                                    {rep.activeLeads} active
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-700 ${isOverloaded ? "bg-red-400" : "bg-teal-600"}`}
                                                    style={{ width: `${(rep.activeLeads / maxLeads) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        {isOverloaded && (
                                            <FiAlertCircle size={16} className="text-red-400 shrink-0" title="Overloaded" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── LEADERBOARD ──────────────────────────────────────────────────── */}
            {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-dashed border-gray-200 text-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[11px]">No Team Data Yet</p>
                    <p className="text-gray-400 text-sm mt-2">Add Sales Reps and their activities to see the leaderboard.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* TOP 3 PODIUM (special cards) */}
                    {leaderboard.length >= 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                            {[leaderboard[1], leaderboard[0], leaderboard[2]].filter(Boolean).map((rep, idx) => {
                                const isChamp = rep.rank === 1;
                                return (
                                    <div
                                        key={rep._id}
                                        className={`rounded-[2rem] border p-8 text-center relative overflow-hidden transition-all ${isChamp
                                            ? "bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 border-yellow-300 shadow-2xl shadow-yellow-200 scale-105"
                                            : "bg-white border-gray-100 shadow-sm"
                                            }`}
                                    >
                                        {isChamp && <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/20 rounded-full blur-2xl" />}
                                        <div className="relative z-10">
                                            <Medal rank={rep.rank} />
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mt-4 mb-3 shadow-lg ${isChamp ? "bg-white/30" : "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-100"}`}>
                                                {rep.name?.charAt(0)}
                                            </div>
                                            <p className={`font-black text-lg tracking-tight ${isChamp ? "text-yellow-900" : "text-gray-900"}`}>{rep.name}</p>
                                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${isChamp ? "bg-white/30 text-yellow-900 border-white/40" : rep.color || "bg-green-50 text-green-700 border-green-100"}`}>
                                                {rep.badge}
                                            </span>
                                            <div className={`mt-4 pt-4 border-t ${isChamp ? "border-white/30" : "border-gray-100"}`}>
                                                <p className={`text-2xl font-black ${isChamp ? "text-yellow-900" : "text-gray-900"}`}>{formatINR(rep.revenue)}</p>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${isChamp ? "text-yellow-800" : "text-gray-400"}`}>Revenue</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* FULL TABLE */}
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Rankings — {month}</p>
                            <div className="flex items-center gap-2 text-xs font-black text-gray-400">
                                <FiUsers size={14} /> {leaderboard.length} Reps
                            </div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {leaderboard.map((rep) => {
                                const barPct = maxScore > 0 ? (rep.score / maxScore) * 100 : 0;
                                return (
                                    <div key={rep._id} className="px-8 py-5 flex items-center gap-6 hover:bg-green-50/30 transition-all group">
                                        {/* Rank */}
                                        <div className="w-10 shrink-0 text-center"><Medal rank={rep.rank} /></div>

                                        {/* Avatar + Name */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
                                                {rep.name?.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-gray-900 truncate">{rep.name}</p>
                                                <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${rep.color || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                                                    {rep.badge}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="hidden lg:grid grid-cols-5 gap-6">
                                            <Stat icon={<FaIndianRupeeSign />} label="Revenue" value={formatINR(rep.revenue)} accent="text-green-500" />
                                            <Stat icon={<FiAward />} label="Deals Won" value={rep.dealsWon} accent="text-yellow-500" />
                                            <Stat icon={<FiTrendingUp />} label="Leads" value={rep.leads} accent="text-teal-600" />
                                            <Stat icon={<FiPhone />} label="Calls" value={rep.calls} accent="text-orange-500" />
                                            <Stat icon={<FiCalendar />} label="Meetings" value={rep.meetings} accent="text-purple-500" />
                                        </div>

                                        {/* Score Bar */}
                                        <div className="hidden md:flex flex-col items-end gap-1 w-32 shrink-0">
                                            <span className="text-xs font-black text-gray-900">{rep.score} pts</span>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                                                    style={{ width: `${barPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── SCORING LEGEND ────────────────────────────────────────────── */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Performance Score Formula</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600 font-bold">
                    <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl">₹1L Revenue = 10 pts</span>
                    <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl">1 Deal Won = 30 pts</span>
                    <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl">1 Call = 2 pts</span>
                    <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl">1 Meeting = 5 pts</span>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage;

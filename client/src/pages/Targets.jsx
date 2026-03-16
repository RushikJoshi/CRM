import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import { getCurrentUser } from "../context/AuthContext";
import {
    FiTarget, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck,
    FiTrendingUp, FiUsers, FiPhone, FiCalendar, FiAward,
    FiChevronLeft, FiChevronRight, FiAlertCircle
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";

// ── Progress bar with color transitions ──────────────────
const ProgressRing = ({ pct, color = "green", size = 72 }) => {
    const r = (size / 2) - 8;
    const circ = 2 * Math.PI * r;
    const stroke = circ - (Math.min(pct, 100) / 100) * circ;
    const colorMap = { green: "#22c55e", blue: "#3b82f6", orange: "#f97316", purple: "#a855f7", red: "#ef4444" };
    const c = colorMap[color] || colorMap.green;
    return (
        <svg width={size} height={size} className="rotate-[-90deg]">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={c} strokeWidth="7"
                strokeDasharray={circ}
                strokeDashoffset={stroke}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
            />
        </svg>
    );
};

const pct = (achieved, target) => {
    if (!target || target === 0) return 0;
    return Math.round((achieved / target) * 100);
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─────────────────────────────────────────────────────────
const TargetsPage = () => {
    const user = getCurrentUser() || {};
    const role = user.role;
    const isMgr = role === "branch_manager" || role === "company_admin";
    const isSales = role === "sales";

    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [targets, setTargets] = useState([]);
    const [myTarget, setMyTarget] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        assignedTo: "", revenueTarget: "", leadsTarget: "",
        dealsTarget: "", callsTarget: "", meetingsTarget: "", notes: ""
    });

    // ── Fetch ─────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (isMgr) {
                const [tRes, mRes] = await Promise.all([
                    API.get(`/targets?month=${month}&year=${year}`),
                    API.get("/targets/team")
                ]);
                setTargets(tRes.data?.data || []);
                setTeamMembers(mRes.data?.data || []);
            } else if (isSales) {
                const tRes = await API.get(`/targets/my?month=${month}&year=${year}`);
                setMyTarget(tRes.data?.data || null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [month, year, isMgr, isSales]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Month Navigation ──────────────────────────────────
    const prevMonth = () => {
        if (month === 1) { setMonth(12); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 12) { setMonth(1); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    // ── Modal helpers ─────────────────────────────────────
    const openAdd = () => {
        setEditTarget(null);
        setForm({ assignedTo: "", revenueTarget: "", leadsTarget: "", dealsTarget: "", callsTarget: "", meetingsTarget: "", notes: "" });
        setShowModal(true);
    };
    const openEdit = (t) => {
        setEditTarget(t);
        setForm({
            assignedTo: t.assignedTo._id || t.assignedTo,
            revenueTarget: t.revenueTarget || "",
            leadsTarget: t.leadsTarget || "",
            dealsTarget: t.dealsTarget || "",
            callsTarget: t.callsTarget || "",
            meetingsTarget: t.meetingsTarget || "",
            notes: t.notes || ""
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.post("/targets", { ...form, month, year });
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Error saving target.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this target?")) return;
        setDeleting(id);
        try { await API.delete(`/targets/${id}`); fetchData(); }
        catch (e) { alert("Failed to delete."); }
        finally { setDeleting(null); }
    };

    const formatINR = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

    // ─── SALES REP VIEW (My Target) ─────────────────────
    const SalesView = () => {
        const t = myTarget;
        if (!t) return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6 shadow-inner">
                    <FiTarget size={40} />
                </div>
                <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[11px]">No Target Assigned Yet</p>
                <p className="text-gray-400 text-sm mt-2">Contact your Branch Manager to set your monthly target.</p>
            </div>
        );

        const metrics = [
            { label: "Revenue", icon: <FaIndianRupeeSign />, achieved: t.achievement.revenueAchieved, target: t.revenueTarget, color: "green", format: formatINR },
            { label: "Leads", icon: <FiTrendingUp />, achieved: t.achievement.leadsAchieved, target: t.leadsTarget, color: "blue", format: v => v },
            { label: "Deals", icon: <FiAward />, achieved: t.achievement.dealsAchieved, target: t.dealsTarget, color: "purple", format: v => v },
            { label: "Calls", icon: <FiPhone />, achieved: t.achievement.callsAchieved, target: t.callsTarget, color: "orange", format: v => v },
            { label: "Meetings", icon: <FiCalendar />, achieved: t.achievement.meetingsAchieved, target: t.meetingsTarget, color: "green", format: v => v },
        ].filter(m => m.target > 0);

        return (
            <div className="space-y-8">
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2rem] p-8 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-green-500/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <p className="text-green-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2">My Monthly Target</p>
                        <h2 className="text-3xl font-black tracking-tight">{MONTHS[month - 1]} {year}</h2>
                        {t.setBy && <p className="text-gray-400 text-sm mt-2">Set by <span className="text-white font-bold">{t.setBy.name}</span></p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {metrics.map((m) => {
                        const p = pct(m.achieved, m.target);
                        const over = p >= 100;
                        return (
                            <div key={m.label} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                                <div className="relative mb-4">
                                    <ProgressRing pct={p} color={over ? "green" : m.color} size={88} />
                                    <div className="absolute inset-0 flex items-center justify-center text-xl font-black" style={{ color: over ? "#22c55e" : "#111" }}>
                                        {p}%
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-xl mb-2">{m.icon}</div>
                                <p className="font-black text-gray-900 text-lg">{m.label}</p>
                                <p className="text-sm text-gray-400 mt-1 font-medium">
                                    <span className="text-gray-900 font-black">{typeof m.achieved === "number" && m.label === "Revenue" ? formatINR(m.achieved) : m.achieved}</span>
                                    {" / "}
                                    {typeof m.target === "number" && m.label === "Revenue" ? formatINR(m.target) : m.target}
                                </p>
                                {over && (
                                    <div className="mt-3 flex items-center gap-1.5 bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <FiCheck size={12} /> Target Hit!
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {t.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
                        <FiAlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                        <p className="text-amber-800 font-bold text-sm">{t.notes}</p>
                    </div>
                )}
            </div>
        );
    };

    // ─── BRANCH MANAGER VIEW (Team Targets) ─────────────
    const ManagerView = () => (
        <div className="space-y-6">
            {loading ? (
                <div className="h-64 bg-white rounded-[2rem] border border-gray-100 flex items-center justify-center">
                    <div className="w-10 h-10 border-[5px] border-green-100 border-t-green-500 rounded-full animate-spin" />
                </div>
            ) : targets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-dashed border-gray-200 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6 shadow-inner">
                        <FiUsers size={32} />
                    </div>
                    <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[11px]">No Targets Set Yet</p>
                    <p className="text-gray-400 text-sm mt-2">Click "Set Target" to assign quotas to your team.</p>
                    <button onClick={openAdd} className="mt-6 flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-100">
                        <FiPlus size={16} /> Set First Target
                    </button>
                </div>
            ) : (
                <div className="space-y-5">
                    {targets.map((t) => {
                        const user = t.assignedTo;
                        const ach = t.achievement;
                        const totalPct = Math.min(100, Math.round(
                            ([pct(ach.revenueAchieved, t.revenueTarget), pct(ach.leadsAchieved, t.leadsTarget), pct(ach.dealsAchieved, t.dealsTarget)]
                                .filter((_, i) => [t.revenueTarget, t.leadsTarget, t.dealsTarget][i] > 0)
                                .reduce((a, b) => a + b, 0) || 0) /
                            ([t.revenueTarget, t.leadsTarget, t.dealsTarget].filter(v => v > 0).length || 1)
                        ));

                        const statusColor = totalPct >= 100 ? "text-green-600 bg-green-50" : totalPct >= 60 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

                        return (
                            <div key={t._id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                                {/* Header */}
                                <div className="p-6 flex items-center justify-between border-b border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-green-100">
                                            {user?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900">{user?.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
                                            {totalPct}% Overall
                                        </span>
                                        <button onClick={() => openEdit(t)} className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all border border-transparent hover:border-green-100">
                                            <FiEdit2 size={15} />
                                        </button>
                                        <button onClick={() => handleDelete(t._id)} disabled={deleting === t._id} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100">
                                            <FiTrash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {[
                                        { label: "Revenue", achieved: ach.revenueAchieved, target: t.revenueTarget, icon: <FaIndianRupeeSign />, color: "green", fmtFn: formatINR },
                                        { label: "Leads", achieved: ach.leadsAchieved, target: t.leadsTarget, icon: <FiTrendingUp />, color: "blue", fmtFn: v => v },
                                        { label: "Deals", achieved: ach.dealsAchieved, target: t.dealsTarget, icon: <FiAward />, color: "purple", fmtFn: v => v },
                                        { label: "Calls", achieved: ach.callsAchieved, target: t.callsTarget, icon: <FiPhone />, color: "orange", fmtFn: v => v },
                                        { label: "Meetings", achieved: ach.meetingsAchieved, target: t.meetingsTarget, icon: <FiCalendar />, color: "green", fmtFn: v => v },
                                    ].map((m) => {
                                        const p = pct(m.achieved, m.target);
                                        if (!m.target) return null;
                                        return (
                                            <div key={m.label} className="flex flex-col items-center text-center">
                                                <div className="relative mb-2">
                                                    <ProgressRing pct={p} color={p >= 100 ? "green" : m.color} size={64} />
                                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-900">{p}%</div>
                                                </div>
                                                <span className="text-gray-400 text-lg mb-1">{m.icon}</span>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{m.label}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    <span className="font-black text-gray-900">{m.label === "Revenue" ? formatINR(m.achieved) : m.achieved}</span>
                                                    / {m.label === "Revenue" ? formatINR(m.target) : m.target}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Overall bar */}
                                <div className="px-6 pb-6">
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-1000 ${totalPct >= 100 ? "bg-green-500" : totalPct >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                                            style={{ width: `${totalPct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // ─── Main Render ────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-2 h-10 bg-green-500 rounded-full shadow-lg shadow-green-200" />
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            {isSales ? "My Quota" : "Team Targets"}
                        </h1>
                    </div>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest pl-5">
                        {isSales ? "Track your monthly performance vs. targets" : "Set and monitor monthly quotas for your sales team"}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Month Navigator */}
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-2xl p-1">
                        <button onClick={prevMonth} className="p-2.5 rounded-xl hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-700 transition-all">
                            <FiChevronLeft size={18} />
                        </button>
                        <span className="px-4 py-2 font-black text-gray-900 text-sm min-w-[100px] text-center">
                            {MONTHS[month - 1]} {year}
                        </span>
                        <button onClick={nextMonth} className="p-2.5 rounded-xl hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-700 transition-all">
                            <FiChevronRight size={18} />
                        </button>
                    </div>

                    {isMgr && (
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                        >
                            <FiPlus size={18} /> Set Target
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Strip (Manager only) */}
            {isMgr && targets.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Team Members", value: targets.length, icon: <FiUsers />, color: "bg-blue-50 text-blue-600" },
                        { label: "Targets On Track", value: targets.filter(t => pct(t.achievement.revenueAchieved, t.revenueTarget) >= 60).length, icon: <FiCheck />, color: "bg-green-50 text-green-600" },
                        { label: "Needs Attention", value: targets.filter(t => pct(t.achievement.revenueAchieved, t.revenueTarget) < 40 && t.revenueTarget > 0).length, icon: <FiAlertCircle />, color: "bg-red-50 text-red-600" },
                        { label: "Targets Achieved", value: targets.filter(t => pct(t.achievement.revenueAchieved, t.revenueTarget) >= 100).length, icon: <FiAward />, color: "bg-purple-50 text-purple-600" },
                    ].map(({ label, value, icon, color }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${color} text-xl`}>{icon}</div>
                            <div>
                                <p className="text-2xl font-black text-gray-900">{value}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Content */}
            {isSales ? <SalesView /> : <ManagerView />}

            {/* Set Target Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">{editTarget ? "Edit Target" : "Set New Target"}</h3>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{MONTHS[month - 1]} {year}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-colors">
                                <FiX size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Team Member */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Sales Rep *</label>
                                <select
                                    required
                                    className="w-full pl-4 pr-10 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 font-bold text-gray-700 text-sm appearance-none cursor-pointer"
                                    value={form.assignedTo}
                                    onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                                    disabled={!!editTarget}
                                >
                                    <option value="">-- Select Sales Rep --</option>
                                    {teamMembers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
                                </select>
                            </div>

                            {/* Revenue */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                                    <FaIndianRupeeSign size={11} /> Revenue Target (₹)
                                </label>
                                <input type="number" min="0" placeholder="e.g. 500000" className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 font-bold text-gray-700 text-sm"
                                    value={form.revenueTarget} onChange={e => setForm({ ...form, revenueTarget: e.target.value })} />
                            </div>

                            {/* Leads / Deals / Calls / Meetings */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { key: "leadsTarget", label: "Lead Conversions", icon: <FiTrendingUp size={11} /> },
                                    { key: "dealsTarget", label: "Deals to Close", icon: <FiAward size={11} /> },
                                    { key: "callsTarget", label: "Calls Target", icon: <FiPhone size={11} /> },
                                    { key: "meetingsTarget", label: "Meetings Target", icon: <FiCalendar size={11} /> },
                                ].map(({ key, label, icon }) => (
                                    <div key={key} className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1.5">{icon} {label}</label>
                                        <input type="number" min="0" placeholder="0" className="w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 font-bold text-gray-700 text-sm"
                                            value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                                    </div>
                                ))}
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Manager's Note (Optional)</label>
                                <textarea rows="2" placeholder="Any guidance or context..." className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 font-bold text-gray-700 text-sm resize-none"
                                    value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>

                            <div className="pt-4 flex gap-4 border-t border-gray-50">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 active:scale-95 transition-all text-[11px] uppercase tracking-widest disabled:opacity-60">
                                    {saving ? "Saving..." : "Save Target"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TargetsPage;

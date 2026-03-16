import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiUsers,
    FiTrendingUp,
    FiCheckCircle,
    FiLayers,
    FiTarget,
    FiPhone,
    FiCalendar,
    FiClock,
    FiActivity,
    FiBriefcase,
    FiZap,
    FiRefreshCw,
    FiArrowUpRight,
    FiUser,
    FiInfo,
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import API from "../services/api";
import { getCurrentUser } from "../context/AuthContext";

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

const MetricWidget = ({ title, value, icon, trend, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full text-left bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-[#E0EAFF] transition-all duration-200 group"
    >
        <div className="flex items-start justify-between gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#2563EB]/20 [&>svg]:w-6 [&>svg]:h-6">
                {icon}
            </div>
            {trend != null && (
                <span className={`text-xs font-semibold ${trend >= 0 ? "text-emerald-500" : "text-gray-400"}`}>
                    {trend >= 0 ? "↗ " : ""}{trend >= 0 ? "+" : ""}{trend}%
                </span>
            )}
        </div>
        <p className="text-2xl font-bold text-gray-900 mt-4 group-hover:text-[#2563EB] transition-colors">{value}</p>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">{title}</p>
    </button>
);

const SkeletonWidget = () => (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 animate-pulse">
        <div className="h-3 w-20 bg-[#E5E7EB] rounded mb-3" />
        <div className="h-8 w-24 bg-[#E5E7EB] rounded mb-3" />
        <div className="h-4 w-16 bg-[#E5E7EB] rounded" />
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();

    const user = getCurrentUser() || {};
    const role = user?.role;
    const isSuperAdmin = role === "super_admin";
    const isSales = role === "sales";
    const basePath = isSuperAdmin ? "/superadmin" : isSales ? "/sales" : role === "branch_manager" ? "/branch" : "/company";

    const fetchStats = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const endpoint = isSuperAdmin ? "/super-admin/platform-stats" : "/dashboard";
            const res = await API.get(endpoint);
            setStats(res.data?.data || res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [role]);

    // Funnel stages: Inquiry → Lead → Prospect → Deal → Won
    const funnelStages = !isSuperAdmin && stats
        ? [
            { label: "Inquiry", count: stats.totalInquiries ?? 0 },
            { label: "Lead", count: stats.totalLeads ?? 0 },
            { label: "Prospect", count: stats.totalProspects ?? 0 },
            { label: "Deal", count: stats.totalDeals ?? 0 },
            { label: "Won", count: stats.dealsWon ?? Math.round((stats.totalDeals ?? 0) * ((stats.conversionRate ?? 0) / 100)) },
        ].filter((s) => s.count !== undefined)
        : [];

    const getActivityIcon = (type) => {
        const map = {
            company: <FiBriefcase className="text-[#2563EB]" size={14} />,
            deal: <FiCheckCircle className="text-[#10B981]" size={14} />,
            lead: <FiTrendingUp className="text-[#2563EB]" size={14} />,
            call: <FiPhone className="text-[#6B7280]" size={14} />,
            meeting: <FiCalendar className="text-[#6B7280]" size={14} />,
        };
        return map[type] || <FiActivity size={14} className="text-[#6B7280]" />;
    };

    if (loading && !stats) {
        return (
            <div className="space-y-8 pb-12">
                <div className="h-10 w-64 bg-[#E5E7EB] rounded-lg animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <SkeletonWidget key={i} />
                    ))}
                </div>
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 animate-pulse">
                    <div className="h-6 w-40 mb-6 bg-[#E5E7EB] rounded" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-14 bg-[#E5E7EB] rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const platformMetrics = [
        { title: "Total Companies", value: stats?.totalCompanies ?? 0, icon: <FiBriefcase size={16} />, link: `${basePath}/companies` },
        { title: "Active Companies", value: stats?.activeCompanies ?? 0, icon: <FiBriefcase size={16} />, link: `${basePath}/companies` },
        { title: "Trial Companies", value: stats?.trialCompanies ?? 0, icon: <FiLayers size={16} />, link: `${basePath}/companies` },
        { title: "Total Users", value: stats?.totalUsers ?? 0, icon: <FiUsers size={16} />, link: `${basePath}/users` },
        { title: "Active Users", value: stats?.activeUsers ?? 0, icon: <FiUsers size={16} />, link: `${basePath}/users` },
        { title: "Platform Revenue", value: formatCurrency(stats?.platformMonthlyRevenue ?? 0), icon: <FaIndianRupeeSign size={16} />, link: `${basePath}/billing` },
        { title: "Plans", value: stats?.subscriptionPlansCount ?? 0, icon: <FiLayers size={16} />, link: `${basePath}/plans` },
        { title: "Server", value: stats?.serverHealth ?? "—", icon: <FiCheckCircle size={16} />, link: null },
        { title: "API Usage", value: stats?.apiUsage ?? 0, icon: <FiActivity size={16} />, link: `${basePath}/usage-analytics` },
        { title: "Storage", value: stats?.storageUsage ?? "—", icon: <FiLayers size={16} />, link: `${basePath}/usage-analytics` },
    ];

    const otherMetrics = [
        { title: isSales ? "Inquiries" : "Inquiries", value: stats?.totalInquiries ?? 0, icon: <FiLayers size={16} />, link: `${basePath}/inquiries` },
        { title: isSales ? "Leads" : "Leads", value: stats?.totalLeads ?? 0, icon: <FiTrendingUp size={16} />, link: `${basePath}/leads` },
        { title: isSales ? "Prospects" : "Qualified Prospects", value: stats?.totalProspects ?? 0, icon: <FiZap size={16} />, link: `${basePath}/prospects` },
        { title: isSales ? "Deals" : "Deals", value: stats?.totalDeals ?? 0, icon: <FiCheckCircle size={16} />, link: `${basePath}/deals` },
        { title: isSales ? "Revenue" : "Revenue", value: formatCurrency(stats?.totalRevenue), icon: <FaIndianRupeeSign size={16} />, link: `${basePath}/reports` },
        { title: "Conversion", value: `${stats?.conversionRate ?? 0}%`, icon: <FiArrowUpRight size={16} />, link: `${basePath}/reports` },
    ];

    const metrics = isSuperAdmin ? platformMetrics : otherMetrics;

    const firstName = user.name?.split(" ")[0] || "User";
    return (
        <div className="space-y-8 pb-12">
            {/* Welcome - Horizon style */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {isSuperAdmin ? "Dashboard" : `Welcome back, ${firstName} 👋`}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isSuperAdmin
                            ? "Platform overview"
                            : "Here's what's happening with your CRM today."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchStats(true)}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <FiRefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* Alerts */}
            {!isSuperAdmin && (stats?.overdueTasks > 0 || stats?.todayTasks > 0 || stats?.agingLeads > 0) && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                            <FiInfo size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Attention needed</p>
                            <p className="text-xs text-gray-500">
                                {[stats.overdueTasks, stats.todayTasks, stats.agingLeads].filter(Boolean).join(" + ")} items
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {stats.overdueTasks > 0 && (
                            <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
                                {stats.overdueTasks} overdue
                            </span>
                        )}
                        {stats.agingLeads > 0 && (
                            <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium">
                                {stats.agingLeads} aging leads
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Metric widgets - Horizon style */}
            <div className={`grid gap-5 ${isSuperAdmin ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 md:grid-cols-4 lg:grid-cols-6"}`}>
                {metrics.map((m, i) => (
                    <MetricWidget
                        key={i}
                        title={m.title}
                        value={m.value}
                        icon={m.icon}
                        trend={i === metrics.length - 1 && typeof stats?.conversionRate === "number" ? stats.conversionRate : null}
                        onClick={m.link ? () => navigate(m.link) : undefined}
                    />
                ))}
            </div>

            {/* Sales funnel - Horizon card style */}
            {!isSuperAdmin && funnelStages.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FiTrendingUp className="text-[#2563EB]" size={20} />
                            Pipeline Performance
                        </h2>
                        <span className="text-sm font-medium text-[#2563EB] bg-[#EEF2FF] px-3 py-1.5 rounded-xl">
                            {stats?.conversionRate ?? 0}% conversion
                        </span>
                    </div>
                    <div className="space-y-4 max-w-3xl">
                        {funnelStages.map((stage, i) => {
                            const prevCount = i > 0 ? funnelStages[i - 1].count : stage.count;
                            const pct = prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 100;
                            const width = funnelStages[0].count > 0 ? Math.max(20, (stage.count / funnelStages[0].count) * 100) : 100;
                            return (
                                <div key={stage.label} className="flex items-center gap-6">
                                    <div className="w-24 shrink-0 text-right">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stage.label}</p>
                                        <p className="text-lg font-bold text-gray-900 mt-0.5">{stage.count}</p>
                                    </div>
                                    <div className="flex-1 h-12 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                                        <div
                                            className="h-full bg-[#2563EB] rounded-xl transition-all duration-500 flex items-center justify-end pr-3"
                                            style={{ width: `${width}%`, minWidth: stage.count > 0 ? "40px" : 0 }}
                                        >
                                            {i > 0 && stage.count > 0 && (
                                                <span className="text-xs font-medium text-white/90">{pct}%</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Super Admin: Recent companies only (no CRM data) */}
            {isSuperAdmin && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <FiBriefcase className="text-indigo-500" size={18} />
                            Recent companies
                        </h3>
                        <button
                            type="button"
                            onClick={() => navigate(`${basePath}/companies`)}
                            className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                            View all
                        </button>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {stats?.recentCompanies?.length > 0 ? (
                            stats.recentCompanies.map((c, i) => (
                                <button
                                    key={c._id || i}
                                    type="button"
                                    onClick={() => navigate(`${basePath}/companies/${c._id}`)}
                                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm shrink-0">
                                        {(c.name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {c.createdAt && new Date(c.createdAt).toLocaleDateString()} · {c.status || "active"}
                                        </p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="px-6 py-12 text-center text-sm text-gray-500">No companies yet</div>
                        )}
                    </div>
                </div>
            )}

            {/* Two columns: Activity + Recent (Company CRM only – hidden for Super Admin) */}
            {!isSuperAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <FiCalendar className="text-[#2563EB]" size={18} />
                                Upcoming
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {stats?.upcomingAgenda?.length > 0 ? (
                                stats.upcomingAgenda.slice(0, 5).map((item, i) => (
                                    <div
                                        key={i}
                                        className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {item.date && new Date(item.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                                            </p>
                                        </div>
                                        <span className="text-xs font-medium text-[#2563EB] px-2.5 py-1 rounded-lg bg-[#EEF2FF]">
                                            {item.type}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-12 text-center text-sm text-gray-500">No upcoming tasks</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <FiActivity className="text-emerald-500" size={18} />
                                Recent Activity
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Latest client engagements</p>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {stats?.recentActivities?.length > 0 ? (
                                stats.recentActivities.slice(0, 6).map((act, i) => (
                                    <div key={i} className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-100 flex items-center justify-center shrink-0">
                                            {getActivityIcon(act.type)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">{act.text}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {act.time && new Date(act.time).toLocaleString()}
                                            </p>
                                        </div>
                                        <span className="text-xs font-medium text-[#2563EB] px-2.5 py-1 rounded-lg bg-[#EEF2FF] shrink-0">{act.type || "Activity"}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-12 text-center text-sm text-gray-500">No recent activity</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">New leads</h3>
                            <button
                                type="button"
                                onClick={() => navigate(`${basePath}/leads`)}
                                className="text-xs font-medium text-[#2563EB] hover:underline"
                            >
                                View all
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {stats?.recentLeads?.length > 0 ? (
                                stats.recentLeads.slice(0, 5).map((lead, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => navigate(`${basePath}/leads`)}
                                        className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#2563EB] flex items-center justify-center font-semibold text-sm shrink-0">
                                            {(lead.name || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{lead.companyName || "—"}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="px-6 py-12 text-center text-sm text-gray-500">No new leads</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline summary</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Revenue</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(stats?.totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Conversion</span>
                                <span className="font-semibold text-emerald-600">{stats?.conversionRate ?? 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default Dashboard;

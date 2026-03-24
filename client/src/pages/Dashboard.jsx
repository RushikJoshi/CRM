import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiUsers,
    FiTrendingUp,
    FiCheckCircle,
    FiLayers,
    FiRefreshCw,
    FiArrowUpRight,
    FiActivity,
    FiCalendar,
    FiPhone,
    FiBriefcase,
    FiZap,
    FiAward,
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import API from "../services/api";
import { getCurrentUser } from "../context/AuthContext";

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

const MetricCard = ({ title, value, icon, onClick, accent = "var(--indigo)" }) => (
    <div 
        onClick={onClick}
        className={`crm-card p-5 flex flex-col justify-between group h-full relative overflow-hidden transition-all duration-300 ${onClick ? "cursor-pointer hover:shadow-[var(--sh-md)] hover:border-[rgba(99,102,241,.2)]" : ""}`}
    >
        <div className="absolute top-0 left-0 w-1 h-full opacity-60" style={{ backgroundColor: accent }} />
        <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-[var(--r)] bg-[var(--surface2)] border border-[var(--border)] text-[var(--txt3)] group-hover:bg-[var(--indigo-l)] group-hover:text-[var(--indigo)] transition-all flex items-center justify-center">
                {React.cloneElement(icon, { size: 16 })}
            </div>
            <div className="p-1 rounded-full bg-[var(--surface2)] opacity-0 group-hover:opacity-100 transition-opacity">
                <FiArrowUpRight size={14} className="text-[var(--txt4)]" />
            </div>
        </div>
        <div className="mt-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt4)] leading-none mb-1.5">{title}</h3>
            <p className="text-[20px] font-bold text-[var(--txt)] leading-none tracking-tight group-hover:text-[var(--indigo)] transition-colors">{value}</p>
        </div>
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

    const platformMetrics = [
        { title: "Total Companies", value: stats?.totalCompanies ?? 0, icon: <FiBriefcase />, link: `${basePath}/companies`, accent: "#6366f1" },
        { title: "Active Users", value: stats?.activeUsers ?? 0, icon: <FiUsers />, link: `${basePath}/users`, accent: "#8b5cf6" },
        { title: "Revenue", value: formatCurrency(stats?.platformMonthlyRevenue ?? 0), icon: <FaIndianRupeeSign />, link: `${basePath}/billing`, accent: "#10b981" },
        { title: "Plans", value: stats?.subscriptionPlansCount ?? 0, icon: <FiLayers />, link: `${basePath}/plans`, accent: "#f59e0b" },
    ];

    const crmMetrics = [
        { title: "Total Leads", value: stats?.totalLeads ?? 0, icon: <FiTrendingUp />, link: `${basePath}/leads`, accent: "#6366f1" },
        { title: "Active Deals", value: stats?.totalDeals ?? 0, icon: <FiAward />, link: `${basePath}/leads`, accent: "#8b5cf6" },
        { title: "Revenue", value: formatCurrency(stats?.totalRevenue ?? 0), icon: <FaIndianRupeeSign />, link: `${basePath}/reports`, accent: "#10b981" },
        { title: "Conversion", value: `${stats?.conversionRate ?? 0}%`, icon: <FiZap />, link: `${basePath}/reports`, accent: "#f59e0b" },
    ];

    if (loading && !stats) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-[var(--border)] rounded-md animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[var(--surface2)] rounded-[var(--r-md)] animate-pulse" />)}
                </div>
            </div>
        );
    }

    const metrics = isSuperAdmin ? platformMetrics : crmMetrics;
    const avatars = ["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-bold text-[var(--txt)] tracking-tight">
                        {isSuperAdmin ? "Platform Overview" : `Welcome, ${user.name?.split(" ")[0]} 👋`}
                    </h1>
                    <p className="text-[12.5px] text-[var(--txt3)] mt-1">Here's a summary of current performance and activity.</p>
                </div>
                <button
                    onClick={() => fetchStats(true)}
                    className="crm-btn-secondary h-8 gap-2"
                >
                    <FiRefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                    <MetricCard 
                        key={i} 
                        title={m.title} 
                        value={m.value} 
                        icon={m.icon} 
                        accent={m.accent}
                        onClick={m.link ? () => navigate(m.link) : null}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Activity */}
                    <div className="crm-card p-0 overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface2)]">
                            <h3 className="text-[13px] font-bold text-[var(--txt)]">Recent Activity</h3>
                        </div>
                        <div className="divide-y divide-[var(--border)]">
                            {(stats?.recentActivities || []).length > 0 ? stats.recentActivities.slice(0, 6).map((act, i) => (
                                <div key={i} className="px-5 py-4 flex items-center gap-4 hover:bg-[var(--bg)] transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center text-[var(--indigo)] shrink-0">
                                        <FiActivity size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-medium text-[var(--txt2)] truncate">{act.text}</p>
                                        <p className="text-[11px] text-[var(--txt4)] mt-0.5">{new Date(act.time || act.date).toLocaleString()}</p>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--txt4)] bg-[var(--surface2)] px-2 py-0.5 rounded-full">{act.type || "Event"}</span>
                                </div>
                            )) : (
                                <div className="p-10 text-center text-[var(--txt4)] text-[12.5px]">No recent activities reported.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Content Area */}
                <div className="space-y-6">
                    <div className="crm-card p-0 overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface2)] flex items-center justify-between">
                            <h3 className="text-[13px] font-bold text-[var(--txt)]">Latest {isSuperAdmin ? "Companies" : "Leads"}</h3>
                            <button onClick={() => navigate(`${basePath}/${isSuperAdmin ? "companies" : "leads"}`)} className="text-[11px] font-bold text-[var(--indigo)] hover:underline">View All</button>
                        </div>
                        <div className="divide-y divide-[var(--border)]">
                            {(isSuperAdmin ? stats?.recentCompanies : stats?.recentLeads || [])?.slice(0, 5).map((item, i) => (
                                <div key={i} className="px-5 py-4 flex items-center gap-3 hover:bg-[var(--bg)] transition-colors cursor-pointer" onClick={() => navigate(`${basePath}/${isSuperAdmin ? "companies" : "leads"}/${item._id}`)}>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${avatars[i % avatars.length]}, #fff3)` }}>
                                        {(item.name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[12.5px] font-semibold text-[var(--txt)] truncate leading-none mb-1">{item.name}</p>
                                        <p className="text-[11px] text-[var(--txt4)] truncate leading-none">{item.companyName || "Personal"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Optional: Add a real content block here in the future */}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

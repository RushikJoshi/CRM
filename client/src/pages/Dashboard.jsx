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
        { label: "Companies", value: stats?.totalCompanies ?? 0, icon: <FiBriefcase />, link: `${basePath}/companies` },
        { label: "Active Users", value: stats?.activeUsers ?? 0, icon: <FiUsers />, link: `${basePath}/users` },
        { label: "Monthly Revenue", value: formatCurrency(stats?.platformMonthlyRevenue ?? 0), icon: <FaIndianRupeeSign />, link: `${basePath}/billing` },
        { label: "Active Plans", value: stats?.subscriptionPlansCount ?? 0, icon: <FiLayers />, link: `${basePath}/plans` },
    ];

    const crmMetrics = [
        { label: "Total Leads", value: stats?.totalLeads ?? 0, icon: <FiTrendingUp />, link: `${basePath}/leads` },
        { label: "Active Deals", value: stats?.totalDeals ?? 0, icon: <FiAward />, link: `${basePath}/deals` },
        { label: "Revenue", value: formatCurrency(stats?.totalRevenue ?? 0), icon: <FaIndianRupeeSign />, link: `${basePath}/reports` },
        { label: "Conversion", value: `${stats?.conversionRate ?? 0}%`, icon: <FiZap />, link: `${basePath}/reports` },
    ];

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const metrics = isSuperAdmin ? platformMetrics : crmMetrics;

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mt-2">
                <div>
                    <h1 className="text-[20px] font-semibold text-[#0f172a] poppins">
                        {isSuperAdmin ? "Platform Dashboard" : `Dashboard Overview`}
                    </h1>
                    <p className="text-[13px] text-slate-500 mt-0.5">Summary of platform performance and recent metrics.</p>
                </div>
                <button
                    onClick={() => fetchStats(true)}
                    className="btn-saas-secondary h-9"
                    disabled={refreshing}
                >
                    <FiRefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Updating..." : "Refresh Stats"}
                </button>
            </div>

            {/* Compact Metrics Strip */}
            <div className="stats-strip">
                {metrics.map((m, i) => (
                    <div key={i} className="stat-item cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => m.link && navigate(m.link)}>
                        <span className="stat-label">{m.label}</span>
                        <div className="flex items-baseline justify-between mt-1">
                            <span className="stat-value">{m.value}</span>
                            <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">
                                {React.cloneElement(m.icon, { size: 14 })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Recent Activity Table */}
                <div className="lg:col-span-2">
                    <div className="saas-table-container">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                            <h2 className="text-[15px] font-semibold text-slate-900 poppins">Recent System Activity</h2>
                            <FiActivity size={14} className="text-slate-400" />
                        </div>
                        <table className="saas-table">
                            <thead>
                                <tr>
                                    <th className="saas-th">Time</th>
                                    <th className="saas-th">Action / Activity</th>
                                    <th className="saas-th">User / Context</th>
                                    <th className="saas-th">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(stats?.recentActivities || []).length > 0 ? stats.recentActivities.slice(0, 10).map((act, i) => (
                                    <tr key={i} className="saas-tr">
                                        <td className="saas-td text-slate-400 font-medium">
                                            {new Date(act.time || act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="saas-td font-medium text-slate-900">{act.text}</td>
                                        <td className="saas-td text-slate-500">{act.user || "System"}</td>
                                        <td className="saas-td">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                act.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                                            }`}>
                                                {act.type || "Success"}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="saas-td text-center py-10 text-slate-400">No recent activity found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar: Latest Items List (Still table-like) */}
                <div className="space-y-6">
                    <div className="saas-table-container">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-[15px] font-semibold text-slate-900 poppins">
                                {isSuperAdmin ? "New Companies" : "Latest Leads"}
                            </h2>
                            <button onClick={() => navigate(`${basePath}/${isSuperAdmin ? "companies" : "leads"}`)} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700">View All</button>
                        </div>
                        <table className="saas-table">
                            <tbody>
                                {(isSuperAdmin ? stats?.recentCompanies : stats?.recentLeads || [])?.slice(0, 8).map((item, i) => (
                                    <tr key={i} className="saas-tr cursor-pointer" onClick={() => navigate(`${basePath}/${isSuperAdmin ? "companies" : "leads"}/${item._id}`)}>
                                        <td className="saas-td w-10 pr-0">
                                            <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-[11px] font-bold">
                                                {(item.name || "?").charAt(0).toUpperCase()}
                                            </div>
                                        </td>
                                        <td className="saas-td">
                                            <div className="font-semibold text-slate-900">{item.name}</div>
                                            <div className="text-[11px] text-slate-400 leading-none mt-0.5">{item.companyName || "Lead"}</div>
                                        </td>
                                        <td className="saas-td text-right">
                                            <FiArrowUpRight size={12} className="text-slate-300 ml-auto" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

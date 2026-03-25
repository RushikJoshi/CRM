import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiUsers,
    FiTrendingUp,
    FiCheckCircle,
    FiLayers,
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
    const navigate = useNavigate();

    const user = getCurrentUser() || {};
    const role = user?.role;
    const isSuperAdmin = role === "super_admin";
    const isSales = role === "sales";
    const basePath = isSuperAdmin ? "/superadmin" : isSales ? "/sales" : role === "branch_manager" ? "/branch" : "/company";
    const fetchStats = async () => {
        setLoading(true);

        try {
            const endpoint = isSuperAdmin ? "/super-admin/platform-stats" : "/dashboard";
            const res = await API.get(endpoint);
            setStats(res.data?.data || res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [role]);    const platformMetrics = [
        { label: "Companies", value: stats?.totalCompanies ?? 0, icon: <FiBriefcase />, link: `${basePath}/companies`, color: "bg-cyan-400" },
        { label: "Active Users", value: stats?.activeUsers ?? 0, icon: <FiUsers />, link: `${basePath}/users`, color: "bg-purple-400" },
        { label: "Monthly Revenue", value: formatCurrency(stats?.platformMonthlyRevenue ?? 0), icon: <FaIndianRupeeSign />, link: `${basePath}/billing`, color: "bg-emerald-400" },
        { label: "Active Plans", value: stats?.subscriptionPlansCount ?? 0, icon: <FiLayers />, link: `${basePath}/plans`, color: "bg-amber-400" },
    ];

    const crmMetrics = [
        { label: "Total Leads", value: stats?.totalLeads ?? 0, icon: <FiTrendingUp />, link: `${basePath}/leads`, color: "bg-cyan-400" },
        { label: "Active Deals", value: stats?.totalDeals ?? 0, icon: <FiAward />, link: `${basePath}/deals`, color: "bg-purple-400" },
        { label: "Revenue", value: formatCurrency(stats?.totalRevenue ?? 0), icon: <FaIndianRupeeSign />, link: `${basePath}/reports`, color: "bg-emerald-400" },
        { label: "Conversion", value: `${stats?.conversionRate ?? 0}%`, icon: <FiZap />, link: `${basePath}/reports`, color: "bg-amber-400" },
    ];

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-cyan-400 rounded-full animate-spin shadow-lg shadow-cyan-400/20" />
                <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">Syncing Data...</p>
            </div>
        );
    }

    const metrics = isSuperAdmin ? platformMetrics : crmMetrics;

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-[28px] font-bold text-slate-800 poppins tracking-tight">
                        {isSuperAdmin ? "Platform Dashboard" : `Dashboard Overview`}
                    </h1>
                    <p className="text-[14px] text-slate-400 font-medium">Summary of platform performance and recent metrics.</p>
                </div>
            </div>


            {/* Stats Grid */}
            <div className="stats-strip">
                {metrics.map((m, i) => (
                    <div 
                        key={i} 
                        className="stat-item group cursor-pointer"
                        onClick={() => m.link && navigate(m.link)}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="stat-label">{m.label}</span>
                                <div className="stat-value mt-2">{m.value}</div>
                            </div>
                            <div className="text-slate-200 group-hover:text-slate-400 transition-colors">
                                {React.cloneElement(m.icon, { size: 24, strokeWidth: 1.5 })}
                            </div>
                        </div>
                        {/* Bottom Accent Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-50 overflow-hidden rounded-b-[20px]">
                            <div className={`h-full w-1/3 rounded-r-full ${m.color} opacity-60`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Card */}
                <div className="lg:col-span-2">
                    <div className="saas-table-container min-h-[300px] flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
                            <h2 className="text-[16px] font-bold text-slate-800 poppins">Recent System Activity</h2>
                            <FiActivity size={18} className="text-slate-300" />
                        </div>
                        <div className="flex-1 flex flex-col">
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
                                    {(stats?.recentActivities || []).length > 0 ? stats.recentActivities.slice(0, 5).map((act, i) => (
                                        <tr key={i} className="saas-tr">
                                            <td className="saas-td text-slate-400 font-medium">
                                                {new Date(act.time || act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="saas-td font-semibold text-slate-700">{act.text}</td>
                                            <td className="saas-td text-slate-500 font-medium">{act.user || "System"}</td>
                                            <td className="saas-td">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    act.type === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                    {act.type || "Success"}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="py-20 text-center text-slate-400 font-medium">No recent activity found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Card: New Companies / Leads */}
                <div className="space-y-8">
                    <div className="saas-table-container p-0">
                        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-[16px] font-bold text-slate-800 poppins">
                                {isSuperAdmin ? "New Companies" : "Latest Leads"}
                            </h2>
                            <button onClick={() => navigate(`${basePath}/${isSuperAdmin ? "companies" : "leads"}`)} className="text-[12px] font-bold text-cyan-500 hover:text-cyan-600 transition-colors">View All</button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {(isSuperAdmin ? stats?.recentCompanies : stats?.recentLeads || [])?.slice(0, 6).map((item, i) => (
                                <div key={i} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => navigate(`${basePath}/${isSuperAdmin ? "companies" : "leads"}/${item._id}`)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-100/50 flex items-center justify-center text-cyan-600 text-[14px] font-black group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                            {(item.name || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-700 text-[14px]">{item.name}</div>
                                            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{item.customId || item.companyName || "Lead"}</div>
                                        </div>
                                    </div>
                                    <FiArrowUpRight size={14} className="text-slate-300 group-hover:text-cyan-500 group-hover:scale-125 transition-all" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;


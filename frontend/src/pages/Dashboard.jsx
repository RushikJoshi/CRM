import React, { useEffect, useState } from "react";
import { FiUsers, FiBriefcase, FiTrendingUp, FiCheckCircle, FiActivity, FiLayers, FiArrowUpRight, FiClock, FiUser, FiPhone, FiCalendar, FiUserCheck } from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import API from "../services/api";
import { getCurrentUser } from "../context/AuthContext";

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const user = getCurrentUser() || {};
    const role = user?.role;

    const fetchStats = async () => {
        try {
            // Role-based endpoint selection
            const endpoint = role === "super_admin" ? "/super-admin/stats" : "/dashboard";
            const res = await API.get(endpoint);
            setStats(res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [role]);

    const formatCurrency = (val) => {
        return `₹${Number(val).toLocaleString('en-IN')} `;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl mb-4 rotate-45"></div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Summoning Intelligence...</p>
                </div>
            </div>
        );
    }

    const isSuperAdmin = role === "super_admin";
    const isSales = role === "sales";

    const statCards = [
        // --- Super Admin Context ---
        { title: "Total Companies", value: stats?.totalCompanies ?? 0, icon: <FiBriefcase />, color: "text-emerald-600", bg: "bg-emerald-50", superAdminOnly: true },
        { title: "Total Branches", value: stats?.totalBranches ?? 0, icon: <FiLayers />, color: "text-green-600", bg: "bg-green-50", superAdminOnly: true },
        { title: "Total Users", value: stats?.totalUsers ?? 0, icon: <FiUsers />, color: "text-emerald-500", bg: "bg-emerald-50", superAdminOnly: true },

        // --- Shared / Company Context ---
        { title: isSales ? "Available Inquiries" : "Total Inquiries", value: stats?.totalInquiries ?? 0, icon: <FiLayers />, color: "text-blue-600", bg: "bg-blue-50", hideForSuperAdmin: true },
        { title: isSales ? "My Active Leads" : "Total Leads", value: stats?.totalLeads ?? 0, icon: <FiTrendingUp />, color: "text-green-600", bg: "bg-green-50", hideForSuperAdmin: true },
        { title: isSales ? "My Open Deals" : "Total Deals", value: stats?.totalDeals ?? 0, icon: <FiCheckCircle />, color: "text-orange-600", bg: "bg-orange-50", hideForSuperAdmin: true },
        { title: isSales ? "Personal Revenue" : "Total Revenue", value: formatCurrency(stats?.totalRevenue ?? 0), icon: <FaIndianRupeeSign />, color: "text-green-600", bg: "bg-green-50", hideForSuperAdmin: true },
        { title: isSales ? "Assigned Customers" : "Customers", value: stats?.totalCustomers ?? 0, icon: <FiUserCheck />, color: "text-emerald-600", bg: "bg-emerald-50", hideForSuperAdmin: true },
        { title: isSales ? "My Contacts" : "Contacts", value: stats?.totalContacts ?? 0, icon: <FiUser />, color: "text-green-500", bg: "bg-green-50", hideForSuperAdmin: true },
        { title: "Today's Calls", value: stats?.todayCalls ?? 0, icon: <FiPhone />, color: "text-orange-500", bg: "bg-orange-50", hideForSuperAdmin: true },
        { title: "Today's Meetings", value: stats?.todayMeetings ?? 0, icon: <FiCalendar />, color: "text-emerald-400", bg: "bg-emerald-50", hideForSuperAdmin: true },
        { title: "My Daily Tasks", value: stats?.todayTasks ?? 0, icon: <FiClock />, color: "text-teal-600", bg: "bg-teal-50", hideForSuperAdmin: true },
        { title: isSales ? "My Conversion" : "Conversion Rate", value: `${stats?.conversionRate ?? 0}%`, icon: <FiArrowUpRight />, color: "text-green-500", bg: "bg-green-50", hideForSuperAdmin: true },
    ].filter(card => {
        if (card.superAdminOnly && !isSuperAdmin) return false;
        if (card.hideForSuperAdmin && isSuperAdmin) return false;
        return true;
    });

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                {isSales && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                )}
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        {isSuperAdmin ? "Super Admin Command Center" : isSales ? "Personal Sales Studio" : "Performance Dashboard"}
                    </h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">
                        {isSuperAdmin
                            ? "Global CRM metrics across all companies and branches."
                            : isSales ? `Hello, ${user.name || 'Sales Pro'}! Here's your personal pipeline performance.` : "Track your sales pipeline and engagement metrics."}
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    className="p-3.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all shadow-sm border border-green-100 z-10"
                >
                    <FiActivity size={20} />
                </button>
            </div>

            {/* Hot Leads Notification */}
            {!isSuperAdmin && stats?.hotLeads?.length > 0 && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-1 rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-white rounded-[14px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Your High-Priority Prospects</h2>
                            </div>
                            <p className="text-sm font-bold text-gray-500 mt-1">These leads have high engagement scores. Close them fast!</p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {stats.hotLeads.map(lead => (
                                <div key={lead._id} className="bg-gray-50/80 hover:bg-red-50 border border-gray-100 hover:border-red-100 rounded-xl p-3 flex items-center gap-4 transition-colors group cursor-pointer">
                                    <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-black">
                                        {lead.score}
                                    </div>
                                    <div className="pr-4">
                                        <p className="text-sm font-black text-gray-800">{lead.name}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mt-0.5">{lead.companyName || "Personal Lead"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Statistics Grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isSales ? '2xl:grid-cols-5' : '2xl:grid-cols-6'} gap-4 md:gap-6`}>
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                        <div className={`absolute top-0 left-0 w-full h-1 ${stat.color.replace('text', 'bg')}`} />
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <div className="text-[8px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">Live Data</div>
                        </div>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.15em]">{stat.title}</p>
                        <h2 className="text-2xl font-black text-gray-900 mt-1 tracking-tighter">{stat.value}</h2>
                    </div>
                ))}
            </div>

            {/* Main Content Panels */}
            {!isSuperAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Activities & Agenda (Large) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Mission Critical Agenda */}
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden border-b-4 border-b-green-500">
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="p-3.5 bg-green-50 text-green-600 rounded-2xl shadow-sm"><FiCalendar size={22} /></div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Personal Focus: Next 48 Hours</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Don't miss these upcoming opportunities.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-50">
                                {stats?.upcomingAgenda?.length > 0 ? stats.upcomingAgenda.map((item, i) => (
                                    <div key={i} className="bg-white p-8 hover:bg-green-50/50 transition-all group relative">
                                        <div className="flex items-center justify-between mb-6">
                                            <span className={`text-[9px] px-3 py-1 rounded-lg font-black uppercase tracking-[0.1em] ${item.type === 'meeting' ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-orange-100 text-orange-600 border border-orange-200'}`}>
                                                {item.type}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                                <FiClock size={12} /> {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <h4 className="text-lg font-black text-gray-800 group-hover:text-green-700 transition-colors mb-2">{item.title}</h4>
                                        <p className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                                            <FiCalendar size={12} /> {new Date(item.date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                )) : (
                                    <div className="col-span-2 py-20 bg-white text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl mx-auto flex items-center justify-center text-gray-200 mb-4 border border-gray-100"><FiCalendar size={28} /></div>
                                        <p className="text-gray-400 font-black italic uppercase tracking-[0.2em] text-xs">No entries in your calendar for next 48 hours.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Events Feed */}
                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden lg:col-span-12">
                            <div className="p-8 border-b border-gray-50 flex items-center gap-4 bg-gray-50/20">
                                <div className="p-3 bg-gray-50 text-gray-400 rounded-xl"><FiClock size={18} /></div>
                                <h3 className="font-black text-gray-900 tracking-tight">Recent Activity Stream</h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-1">
                                    {stats?.recentActivities?.map((act, i) => (
                                        <div key={i} className="flex gap-6 p-4 rounded-2xl hover:bg-gray-50 transition-all group">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-green-500 animate-pulse ring-4 ring-green-100' : 'bg-gray-200'} z-10`} />
                                                {i !== stats.recentActivities.length - 1 && <div className="w-0.5 h-full bg-gray-100 -mt-2 mb-2" />}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(act.time).toLocaleString()}</p>
                                                <p className="text-base font-bold text-gray-800 mt-1 group-hover:text-green-600 transition-colors">{act.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
                                        <div className="text-center py-10 text-gray-400 font-bold text-xs uppercase tracking-widest italic">No recent events logged.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Side Pipelines */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Personal Inbound Leads */}
                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden group">
                            <div className="p-7 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-green-50 text-green-600 rounded-xl shadow-sm"><FiTrendingUp /></div>
                                    <h3 className="font-black text-gray-900 tracking-tight">{isSales ? 'My Fresh Leads' : 'Inbound Leads'}</h3>
                                </div>
                                <button className="p-2 text-gray-300 hover:text-green-500 transition-colors"><FiArrowUpRight /></button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {stats?.recentLeads?.length > 0 ? stats.recentLeads.map((lead, i) => (
                                    <div key={i} className="p-5 flex items-center gap-4 hover:bg-green-50 transition-colors group/item">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-100 flex items-center justify-center font-black text-gray-400 uppercase group-hover/item:border-green-200 group-hover/item:text-green-600 group-hover/item:bg-white transition-all">
                                            {lead.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-gray-900 truncate">{lead.name}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase truncate mt-0.5">{lead.companyId?.name || "Independent Account"}</p>
                                        </div>
                                        <span className={`text-[8px] px-2 py-0.5 rounded-md font-black ${lead.status === 'new' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} uppercase tracking-widest`}>
                                            {lead.status}
                                        </span>
                                    </div>
                                )) : <div className="p-12 text-center text-gray-400 italic font-black text-[10px] uppercase">No active leads assigned.</div>}
                            </div>
                        </div>

                        {/* Personal Active Deals */}
                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden group">
                            <div className="p-7 border-b border-orange-50 flex items-center justify-between bg-orange-50/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl shadow-sm"><FiCheckCircle /></div>
                                    <h3 className="font-black text-gray-900 tracking-tight">{isSales ? 'My Active Pipeline' : 'Active Deals'}</h3>
                                </div>
                                <button className="p-2 text-orange-200 hover:text-orange-500 transition-colors"><FiArrowUpRight /></button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {stats?.recentDeals?.length > 0 ? stats.recentDeals.map((deal, i) => (
                                    <div key={i} className="p-5 flex items-center gap-4 hover:bg-orange-50/30 transition-colors group/item">
                                        <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-black shadow-sm group-hover/item:scale-110 transition-transform">
                                            <FaIndianRupeeSign size={13} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-gray-900 truncate">{deal.title}</p>
                                            <p className="text-[10px] font-black text-orange-600/70 uppercase tracking-tight">{formatCurrency(deal.value)}</p>
                                        </div>
                                        <span className="text-[8px] px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded-md font-black uppercase tracking-widest">
                                            {deal.stage}
                                        </span>
                                    </div>
                                )) : <div className="p-12 text-center text-gray-400 italic font-black text-[10px] uppercase">No pending deals in pipeline.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

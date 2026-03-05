import React, { useEffect, useState } from "react";
import { FiUsers, FiBriefcase, FiTrendingUp, FiCheckCircle, FiActivity, FiLayers, FiArrowUpRight, FiClock, FiUser, FiPhone, FiCalendar, FiUserCheck } from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import API from "../services/api";

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role;

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

    const statCards = [
        { title: "Total Companies", value: stats?.totalCompanies ?? 0, icon: <FiBriefcase />, color: "text-emerald-600", bg: "bg-emerald-50", superAdminOnly: true },
        { title: "Total Branches", value: stats?.totalBranches ?? 0, icon: <FiLayers />, color: "text-green-600", bg: "bg-green-50", superAdminOnly: true },
        { title: "Total Users", value: stats?.totalUsers ?? 0, icon: <FiUsers />, color: "text-emerald-500", bg: "bg-emerald-50", superAdminOnly: true },
        { title: "Total Inquiries", value: stats?.totalInquiries ?? 0, icon: <FiLayers />, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Total Leads", value: stats?.totalLeads ?? 0, icon: <FiTrendingUp />, color: "text-green-600", bg: "bg-green-50" },
        { title: "Total Deals", value: stats?.totalDeals ?? 0, icon: <FiCheckCircle />, color: "text-orange-600", bg: "bg-orange-50" },
        { title: "Total Revenue", value: formatCurrency(stats?.totalRevenue ?? 0), icon: <FaIndianRupeeSign />, color: "text-green-600", bg: "bg-green-50" },
        { title: "Customers", value: stats?.totalCustomers ?? 0, icon: <FiUserCheck />, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Contacts", value: stats?.totalContacts ?? 0, icon: <FiUser />, color: "text-green-500", bg: "bg-green-50" },
        { title: "Today's Calls", value: stats?.todayCalls ?? 0, icon: <FiPhone />, color: "text-orange-500", bg: "bg-orange-50" },
        { title: "Today's Meetings", value: stats?.todayMeetings ?? 0, icon: <FiCalendar />, color: "text-emerald-400", bg: "bg-emerald-50" },
        { title: "Today's Tasks", value: stats?.todayTasks ?? 0, icon: <FiClock />, color: "text-teal-600", bg: "bg-teal-50" },
        { title: "Conversion Rate", value: `${stats?.conversionRate ?? 0}% `, icon: <FiArrowUpRight />, color: "text-green-500", bg: "bg-green-50" },
    ].filter(card => !card.superAdminOnly || role === "super_admin");

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        {role === "super_admin" ? "Super Admin Command Center" : "Performance Dashboard"}
                    </h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">
                        {role === "super_admin"
                            ? "Global CRM metrics across all companies and branches."
                            : "Track your sales pipeline and engagement metrics."}
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    className="p-3.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all shadow-sm border border-green-100"
                >
                    <FiActivity size={20} />
                </button>
            </div>

            {/* Hot Leads Notification at Top */}
            {stats?.hotLeads?.length > 0 && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-1 rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-white rounded-[14px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">AI Identified Hot Leads</h2>
                            </div>
                            <p className="text-sm font-bold text-gray-500 mt-1">These prospects have high engagement scores &gt; 60.</p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {stats.hotLeads.map(lead => (
                                <div key={lead._id} className="bg-gray-50/80 hover:bg-red-50 border border-gray-100 hover:border-red-100 rounded-xl p-3 flex items-center gap-4 transition-colors group cursor-pointer">
                                    <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-black">
                                        {lead.score}
                                    </div>
                                    <div className="pr-4">
                                        <p className="text-sm font-black text-gray-800">{lead.name}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mt-0.5">{lead.companyName || "Independent"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Global Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 md:gap-6">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative w-full">
                        <div className={`absolute top-0 right-0 w-1.5 h-full ${stat.color.replace('text', 'bg')}`} />
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center text-lg mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                            {stat.icon}
                        </div>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.15em]">{stat.title}</p>
                        <h2 className="text-xl font-black text-gray-900 mt-1 tracking-tighter">{stat.value}</h2>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {/* Recent Activities Feed */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
                        <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><FiClock /></div>
                        <h3 className="font-black text-gray-900 tracking-tight">System Events</h3>
                    </div>
                    <div className="p-2 overflow-y-auto max-h-[500px] flex-1">
                        {stats?.recentActivities?.map((act, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-green-50 transition-colors group relative">
                                <div className={`w-1.5 h-1.5 mt-2 rounded-full ${i === 0 ? 'bg-green-500 ring-4 ring-green-100' : 'bg-gray-200'}`} />
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p className="text-sm font-bold text-gray-800 mt-1 group-hover:text-green-700 transition-colors">{act.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Leads */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><FiTrendingUp /></div>
                            <h3 className="font-black text-gray-900 tracking-tight">Inbound Leads</h3>
                        </div>
                        <FiArrowUpRight className="text-gray-300" />
                    </div>
                    <div className="divide-y divide-gray-50 flex-1 overflow-y-auto max-h-[500px]">
                        {stats?.recentLeads?.length > 0 ? stats.recentLeads.map((lead, i) => (
                            <div key={i} className="p-5 flex items-center gap-4 hover:bg-green-50 transition-colors group">
                                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-500 uppercase group-hover:bg-green-100 group-hover:text-green-600 transition-all">
                                    {lead.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-gray-900">{lead.name}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{lead.companyId?.name || "Independent Entity"}</p>
                                </div>
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${lead.status === 'new' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                                    } uppercase tracking-widest`}>
                                    {lead.status}
                                </span>
                            </div>
                        )) : <div className="p-16 text-center text-gray-400 italic font-bold text-xs uppercase tracking-widest">No Active Prospecting</div>}
                    </div>
                </div>

                {/* Recent Deals */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><FiCheckCircle /></div>
                            <h3 className="font-black text-gray-900 tracking-tight">Active Deals</h3>
                        </div>
                        <FiArrowUpRight className="text-gray-300" />
                    </div>
                    <div className="divide-y divide-gray-50 flex-1 overflow-y-auto max-h-[500px]">
                        {stats?.recentDeals?.length > 0 ? stats.recentDeals.map((deal, i) => (
                            <div key={i} className="p-5 flex items-center gap-4 hover:bg-green-50 transition-colors group">
                                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center font-black text-orange-600 group-hover:scale-110 transition-transform">
                                    <FaIndianRupeeSign size={14} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-gray-900">{deal.title}</p>
                                    <p className="text-[10px] font-black text-orange-600/60 uppercase tracking-tight">{formatCurrency(deal.value)}</p>
                                </div>
                                <span className="text-[10px] px-2.5 py-1 bg-green-50 text-green-600 rounded-full font-black uppercase tracking-widest">
                                    {deal.stage}
                                </span>
                            </div>
                        )) : <div className="p-16 text-center text-gray-400 italic font-bold text-xs uppercase tracking-widest">No Pipeline Activity</div>}
                    </div>
                </div>

                {/* Upcoming Agenda */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden md:col-span-2 xl:col-span-3">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><FiCalendar /></div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Mission Critical Agenda</h3>
                        </div>
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] bg-green-50 px-4 py-1 rounded-full border border-green-100">Horizon: 48H</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-gray-50">
                        {stats?.upcomingAgenda?.length > 0 ? stats.upcomingAgenda.map((item, i) => (
                            <div key={i} className="p-6 hover:bg-green-50/50 transition-all group relative">
                                <div className="flex items-center justify-between mb-5">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-[0.1em] ${item.type === 'meeting' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{item.type}</span>
                                    <span className="text-[10px] font-black text-gray-400 tracking-tighter">{new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <h4 className="text-sm font-black text-gray-800 group-hover:text-green-600 transition-colors truncate tracking-tight">{item.title}</h4>
                                <p className="text-[11px] text-gray-500 font-bold mt-1.5 mb-5 flex items-center gap-2 italic"><FiClock size={12} /> {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                                    <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-[10px] font-black text-white uppercase shadow-md shadow-gray-200">{item.assignedTo?.charAt(0) || "U"}</div>
                                    <span className="text-[11px] font-black text-gray-400 group-hover:text-gray-700 transition-colors">{item.assignedTo || "Unassigned"}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-16 text-center">
                                <p className="text-gray-400 font-black italic uppercase tracking-[0.2em] text-xs">No Imminent Engagements</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

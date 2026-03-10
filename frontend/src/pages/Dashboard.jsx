import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiUsers, FiTrendingUp, FiCheckCircle, FiLayers,
    FiPhone, FiCalendar, FiClock, FiActivity, FiBriefcase,
    FiZap, FiRefreshCw, FiArrowUpRight, FiUser, FiInfo
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import API from "../services/api";
import { getCurrentUser } from "../context/AuthContext";

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
            const endpoint = isSuperAdmin ? "/super-admin/stats" : "/dashboard";
            const res = await API.get(endpoint);
            setStats(res.data?.data || res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchStats(); }, [role]);

    const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

    const getActivityIcon = (type) => {
        const icons = {
            company: <FiBriefcase className="text-blue-500" size={14} />,
            deal: <FiCheckCircle className="text-indigo-500" size={14} />,
            lead: <FiTrendingUp className="text-blue-400" size={14} />,
            call: <FiPhone className="text-orange-500" size={14} />,
            meeting: <FiCalendar className="text-purple-500" size={14} />,
        };
        return icons[type] || <FiActivity size={14} className="text-[#A0AEC0]" />;
    };

    const getActivityBg = (type) => {
        const bgs = {
            company: "bg-blue-50",
            deal: "bg-indigo-50",
            lead: "bg-blue-50",
            call: "bg-orange-50",
            meeting: "bg-purple-50",
        };
        return bgs[type] || "bg-slate-50";
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-in fade-in duration-1000">
                <div className="relative">
                    <div className="w-20 h-20 border-[6px] border-blue-50 border-t-blue-500 rounded-full animate-spin shadow-2xl" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    </div>
                </div>
                <div className="text-center space-y-3">
                    <p className="text-[13px] font-black text-gray-900 uppercase tracking-widest">Loading Dashboard...</p>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Please wait while we sync your data</p>
                </div>
            </div>
        );
    }


    const superAdminCards = [
        { title: "Total Companies", value: stats?.totalCompanies ?? 0, icon: <FiBriefcase />, color: "text-sky-600", bg: "bg-sky-50", link: `${basePath}/companies` },
        { title: "Total Branches", value: stats?.totalBranches ?? 0, icon: <FiLayers />, color: "text-emerald-600", bg: "bg-emerald-50", link: `${basePath}/branches` },
        { title: "Total Users", value: stats?.totalUsers ?? 0, icon: <FiUsers />, color: "text-sky-600", bg: "bg-sky-50", link: `${basePath}/users` },
        { title: "Total Leads", value: stats?.totalLeads ?? 0, icon: <FiTrendingUp />, color: "text-emerald-600", bg: "bg-emerald-50", link: null },
        { title: "Total Deals", value: stats?.totalDeals ?? 0, icon: <FiCheckCircle />, color: "text-sky-600", bg: "bg-sky-50", link: null },
        { title: "Total Revenue", value: formatCurrency(stats?.totalRevenue ?? 0), icon: <FaIndianRupeeSign />, color: "text-emerald-600", bg: "bg-emerald-50", link: `${basePath}/reports` },
    ];

    const otherCards = [
        { title: isSales ? "New Inquiries" : "Total Inquiries", value: stats?.totalInquiries ?? 0, icon: <FiLayers />, color: "text-sky-600", bg: "bg-sky-50", link: `${basePath}/inquiries` },
        { title: isSales ? "Active Leads" : "Total Leads", value: stats?.totalLeads ?? 0, icon: <FiTrendingUp />, color: "text-emerald-600", bg: "bg-emerald-50", link: `${basePath}/leads` },
        { title: isSales ? "My Prospects" : "Qualified Prospects", value: stats?.totalProspects ?? 0, icon: <FiZap />, color: "text-sky-600", bg: "bg-sky-50", link: `${basePath}/prospects` },
        { title: isSales ? "Open Deals" : "Total Deals", value: stats?.totalDeals ?? 0, icon: <FiCheckCircle />, color: "text-emerald-600", bg: "bg-emerald-50", link: `${basePath}/deals` },
        { title: isSales ? "Personal Revenue" : "Total Revenue", value: formatCurrency(stats?.totalRevenue ?? 0), icon: <FaIndianRupeeSign />, color: "text-sky-600", bg: "bg-sky-50", link: `${basePath}/reports` },
        { title: "Accounts", value: stats?.totalCustomers ?? 0, icon: <FiBriefcase />, color: "text-emerald-600", bg: "bg-emerald-50", link: `${basePath}/customers` },
        { title: "Contacts", value: stats?.totalContacts ?? 0, icon: <FiUser />, color: "text-sky-500", bg: "bg-sky-50", link: `${basePath}/contacts` },
        { title: "Today's Calls", value: stats?.todayCalls ?? 0, icon: <FiPhone />, color: "text-emerald-500", bg: "bg-emerald-50", link: `${basePath}/calls` },
        { title: "Today's Meetings", value: stats?.todayMeetings ?? 0, icon: <FiCalendar />, color: "text-sky-400", bg: "bg-sky-50", link: `${basePath}/meetings` },
        { title: "Daily Tasks", value: stats?.todayTasks ?? 0, icon: <FiClock />, color: "text-emerald-600", bg: "bg-emerald-50", link: null },
        { title: "Conversion", value: `${stats?.conversionRate ?? 0}%`, icon: <FiArrowUpRight />, color: "text-sky-500", bg: "bg-sky-50", link: `${basePath}/reports` },
        ...((role === "branch_manager" || role === "company_admin") ? [{ title: "Active Team", value: stats?.activeUsers ?? 0, icon: <FiUsers />, color: "text-emerald-600", bg: "bg-emerald-50", link: `${basePath}/users` }] : [])
    ];


    return (
        <div className="space-y-10 pb-16">
            {/* ─── Header Section ───────────────────────────────────── */}
            <div className="bg-white p-10 rounded-[32px] border border-[#E5EAF2] shadow-sm relative overflow-hidden backdrop-blur-md bg-white/80">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-all duration-1000 animate-pulse" />

                <div className="flex flex-col lg:row md:items-center justify-between gap-10 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-2.5 h-12 bg-sky-500 rounded-full shadow-lg shadow-sky-200" />
                            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
                                {isSuperAdmin ? "Dashboard" :
                                    role === "company_admin" ? "Dashboard" :
                                        role === "branch_manager" ? "Dashboard" : `Welcome, ${user.name?.split(' ')[0] || 'User'}`}
                            </h1>
                        </div>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest ml-6 opacity-80">
                            {isSuperAdmin ? "Overview of platform performance and companies." :
                                role === "branch_manager" ? "View branch activity and team progress." :
                                    "Manage your sales pipeline and tasks."}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => fetchStats(true)}
                            disabled={refreshing}
                            className="group flex items-center gap-4 px-8 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-[11px] uppercase tracking-widest text-gray-400 hover:text-sky-500 hover:border-sky-200 hover:bg-white transition-all shadow-sm active:scale-95"
                        >
                            <FiRefreshCw className={`text-base ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Activity Reminders ─────────────────────────────────── */}
            {!isSuperAdmin && (stats?.overdueTasks > 0 || stats?.todayTasks > 0 || stats?.agingLeads > 0) && (
                <div className="bg-white rounded-[32px] p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 border border-red-100 bg-red-50/20 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-red-100/50 text-red-600 rounded-2xl flex items-center justify-center text-2xl border border-red-200">
                            <FiInfo />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 leading-none">Alerts</h2>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                                You have <span className="text-red-600 font-black">{stats.overdueTasks + stats.todayTasks + stats.agingLeads}</span> items that need attention
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {stats.overdueTasks > 0 && <div className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20">{stats.overdueTasks} Overdue Tasks</div>}
                        {stats.agingLeads > 0 && <div className="px-5 py-2.5 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20">{stats.agingLeads} Aging Leads</div>}
                    </div>
                </div>
            )}

            {/* ─── Stat Grid ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {(isSuperAdmin ? superAdminCards : otherCards).map((card, i) => (
                    <div
                        key={i}
                        onClick={() => card.link && navigate(card.link)}
                        className={`bg-white p-8 rounded-[28px] border border-[#E5EAF2] shadow-sm transition-all duration-500 group hover:shadow-2xl hover:border-blue-200 ${card.link ? 'cursor-pointer hover:-translate-y-2' : ''}`}
                    >
                        <div className={`w-14 h-14 rounded-[20px] ${card.bg.replace('emerald', 'blue').replace('green', 'indigo')} ${card.color.replace('emerald', 'blue').replace('green', 'indigo')} flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                            {card.icon}
                        </div>
                        <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.15em] mb-2">{card.title}</p>
                        <h2 className="text-3xl font-black text-[#1A202C] tracking-tight group-hover:text-blue-600 transition-colors">{card.value}</h2>
                    </div>
                ))}
            </div>

            {/* ─── Conversion Funnel ─────────────────────────────────── */}
            {!isSuperAdmin && stats?.funnel && (
                <div className="bg-white rounded-[32px] border border-[#E5EAF2] shadow-sm overflow-hidden p-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <FiTrendingUp className="text-sky-500" /> Sales Funnel
                            </h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 opacity-80">Track how leads move through your process</p>
                        </div>
                        <div className="px-6 py-3 bg-sky-50 text-sky-600 rounded-2xl font-black text-[11px] border border-sky-100 shadow-sm uppercase tracking-widest">
                            {stats.conversionRate || 0}% Conversion Rate
                        </div>
                    </div>

                    <div className="space-y-6 max-w-5xl mx-auto">
                        {stats.funnel.map((step, i) => (
                            <div key={i} className="group flex items-center gap-10">
                                <div className="w-32 text-right shrink-0">
                                    <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest leading-none">{step.label}</p>
                                    <p className="text-2xl font-black text-[#1A202C] mt-1.5">{step.count}</p>
                                </div>
                                <div className="flex-1 h-20 bg-[#F4F7FB]/50 rounded-[24px] border border-[#E5EAF2] relative overflow-hidden group-hover:border-blue-200 transition-all duration-300">
                                    <div
                                        className={`${step.color.replace('emerald', 'blue').replace('green', 'indigo')} h-full transition-all duration-1000 ease-out flex items-center justify-end px-10 rounded-r-[24px] shadow-inner`}
                                        style={{ width: `${100 - (i * 10)}%`, opacity: 1 - (i * 0.08) }}
                                    >
                                        {i > 0 && (
                                            <div className="text-white text-[11px] font-black uppercase tracking-widest bg-black/10 px-4 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                                                {((step.count / (stats.funnel[i - 1].count || 1)) * 100).toFixed(0)}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Bottom Sections ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Performance Leaderboard */}
                {(role === "company_admin" || role === "branch_manager") && stats?.performanceLeaderboard?.length > 0 && (
                    <div className="lg:col-span-12 bg-white rounded-[32px] border border-[#E5EAF2] shadow-sm overflow-hidden p-12">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-[24px] flex items-center justify-center text-3xl shadow-sm border border-amber-100 transition-transform hover:rotate-6">
                                <FiTrendingUp />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-[#1A202C] tracking-tight">Revenue Leaders</h3>
                                <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.2em] mt-2 opacity-80">Ranked by closed deal volume & total acquisition value</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                            {stats.performanceLeaderboard.map((u, i) => (
                                <div key={i} className="bg-[#F4F7FB]/50 rounded-[32px] p-8 border border-[#E5EAF2] hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                                    {i === 0 && <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl animate-pulse" />}
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-[15px] ${i === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white border border-[#E5EAF2] text-[#718096]'}`}>
                                            #{i + 1}
                                        </div>
                                        {i === 0 && <span className="text-[10px] bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-amber-100">Top Tier</span>}
                                    </div>
                                    <p className="font-black text-[#1A202C] text-xl truncate mb-8 group-hover:text-blue-600 transition-colors">{u.name}</p>
                                    <div className="space-y-6">
                                        <div className="flex justify-between text-[11px] font-black text-[#A0AEC0] uppercase tracking-widest">
                                            <span>Volume</span>
                                            <span className="text-[#1A202C]">{u.dealsWon} Deals</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-black text-[#A0AEC0] uppercase tracking-widest">
                                            <span>Total Value</span>
                                            <span className="text-blue-600 font-black">{formatCurrency(u.totalRevenue)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Left Column: Schedule & Activity */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="bg-white rounded-[32px] border border-[#E5EAF2] shadow-sm overflow-hidden">
                        <div className="px-10 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-black text-gray-900 flex items-center gap-4 tracking-tight text-lg"><FiCalendar className="text-sky-500" /> Upcoming Tasks</h3>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Next 48 Hours</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-y divide-[#F0F2F5]">
                            {stats?.upcomingAgenda?.length > 0 ? stats.upcomingAgenda.map((item, i) => (
                                <div key={i} className="p-10 hover:bg-slate-50 transition-all group cursor-pointer duration-300">
                                    <div className="flex justify-between items-start mb-6">
                                        <span className={`text-[10px] px-4 py-1.5 rounded-xl font-black uppercase tracking-widest border ${item.type === 'meeting' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{item.type}</span>
                                        <div className="w-10 h-10 rounded-xl bg-white border border-[#E5EAF2] flex items-center justify-center text-[#CBD5E0] group-hover:text-blue-600 group-hover:border-blue-200 transition-all shadow-sm group-hover:rotate-12"><FiArrowUpRight /></div>
                                    </div>
                                    <h4 className="text-xl font-black text-[#1A202C] leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h4>
                                    <p className="text-[12px] font-bold text-[#A0AEC0] mt-3 group-hover:text-[#718096] transition-colors">{new Date(item.date).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}</p>
                                </div>
                            )) : <div className="col-span-2 py-40 text-center text-[#CBD5E0] font-black text-[11px] uppercase tracking-[0.3em]">No agenda items synchronized.</div>}
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] border border-[#E5EAF2] shadow-sm overflow-hidden">
                        <div className="px-10 py-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            <h3 className="font-black text-gray-900 flex items-center gap-4 tracking-tight text-lg"><FiActivity className="text-emerald-500" /> Recent Activity</h3>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Latest Updates</span>
                        </div>
                        <div className="p-8 space-y-4">
                            {stats?.recentActivities?.map((act, i) => (
                                <div key={i} className="flex gap-8 p-8 rounded-[28px] hover:bg-[#F4F7FB] transition-all group border border-transparent hover:border-[#E5EAF2] duration-300">
                                    <div className={`w-16 h-16 rounded-[22px] ${getActivityBg(act.type).replace('emerald', 'blue').replace('green', 'indigo')} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 group-hover:-rotate-3 transition-all duration-500`}>
                                        {getActivityIcon(act.type)}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.25em]">{new Date(act.time).toLocaleString()}</p>
                                        </div>
                                        <p className="text-lg font-bold text-[#1A202C] tracking-tight group-hover:text-blue-600 transition-all truncate">{act.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Leads & Conversion */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="bg-white rounded-[32px] border border-[#E5EAF2] shadow-sm overflow-hidden">
                        <div className="px-10 py-8 border-b border-[#F0F2F5] flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-[#1A202C] tracking-tight text-lg">New Records</h3>
                            <button onClick={() => navigate(`${basePath}/leads`)} className="p-2 text-[#CBD5E0] hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-[#E5EAF2]"><FiArrowUpRight size={22} /></button>
                        </div>
                        <div className="divide-y divide-[#F0F2F5]">
                            {stats?.recentLeads?.length > 0 ? stats.recentLeads.map((lead, i) => (
                                <div key={i} className="p-8 flex items-center gap-6 hover:bg-slate-50 transition-all cursor-pointer group/item duration-300">
                                    <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5EAF2] flex items-center justify-center font-black text-[#718096] group-hover/item:text-blue-600 group-hover/item:border-blue-200 group-hover/item:shadow-xl group-hover/item:scale-105 transition-all text-xl">
                                        {lead.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-black text-[#1A202C] truncate tracking-tight mb-1 group-hover/item:text-blue-600 transition-colors">{lead.name}</p>
                                        <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.15em]">{lead.companyName || "Personal Lead"}</p>
                                    </div>
                                </div>
                            )) : <div className="p-20 text-center text-[#CBD5E0] font-black text-[11px] uppercase tracking-[.2em] italic">Queue Empty</div>}
                        </div>
                    </div>

                    <div className="bg-[#1A202C] rounded-[32px] p-12 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-20 -bottom-20 w-56 h-56 bg-blue-500/10 rounded-full blur-[80px] group-hover:bg-blue-500/20 transition-all duration-1000" />
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-10 shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                            <FiZap className="text-white" size={32} />
                        </div>
                        <h3 className="text-3xl font-black tracking-tight mb-4">Pipeline Velocity</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-12 font-medium">Maximize your win-rate by focusing on high-scoring leads and active deals.</p>

                        <div className="space-y-8">
                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.25em] border-b border-white/5 pb-6">
                                <span className="text-slate-500">Net Portfolio</span>
                                <span className="text-white text-base">{formatCurrency(stats?.totalRevenue ?? 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.25em]">
                                <span className="text-slate-500">Efficiency</span>
                                <span className="text-blue-400 text-base">{stats?.conversionRate}% Optimal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

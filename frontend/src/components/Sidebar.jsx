import React, { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiLayout,
    FiBriefcase,
    FiGitPullRequest,
    FiUsers,
    FiTarget,
    FiPieChart,
    FiSettings,
    FiLogOut,
    FiChevronLeft,
    FiChevronRight,
    FiDatabase,
    FiUserCheck,
    FiPhone,
    FiCalendar,
    FiCheckSquare,
    FiUser,
    FiCpu,
    FiInbox,
    FiFlag,
    FiBarChart2,
    FiAward
} from "react-icons/fi";

import { FaIndianRupeeSign } from "react-icons/fa6";
import { AuthContext, getCurrentUser } from "../context/AuthContext";

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);
    const user = getCurrentUser() || {};
    const role = user.role;

    // Determine the role-based path prefix
    const rolePrefix = (() => {
        if (role === "super_admin") return "/superadmin";
        if (role === "company_admin") return "/company";
        if (role === "branch_manager") return "/branch";
        if (role === "sales") return "/sales";
        return "";
    })();

    const fullMenuItems = [
        { name: "Dashboard", icon: <FiLayout />, path: "/dashboard", roles: ["super_admin", "company_admin", "branch_manager", "sales"] },
        { name: "My Agenda", icon: <FiCalendar />, path: "/planner", roles: ["branch_manager", "sales"] },
        { name: "Inquiries", icon: <FiInbox />, path: "/inquiries", roles: ["company_admin", "branch_manager", "sales"] },
        { name: "Companies", icon: <FiBriefcase />, path: "/companies", roles: ["super_admin"] },
        { name: "Master", icon: <FiDatabase />, path: "/master", roles: ["company_admin"] },
        { name: "Branches", icon: <FiGitPullRequest />, path: "/branches", roles: ["company_admin"] },
        { name: "Users", icon: <FiUsers />, path: "/users", roles: ["company_admin", "branch_manager"] },
        { name: "Leads", icon: <FiTarget />, path: "/leads", roles: ["company_admin", "branch_manager", "sales"], labelMap: { "sales": "My Leads" } },
        { name: "Customers", icon: <FiUserCheck />, path: "/customers", roles: ["company_admin", "branch_manager", "sales"] },
        { name: "Contacts", icon: <FiUser />, path: "/contacts", roles: ["branch_manager"] },
        { name: "Deals", icon: <FaIndianRupeeSign />, path: "/deals", roles: ["company_admin", "branch_manager", "sales"], labelMap: { "sales": "My Deals" } },
        { name: "Calls", icon: <FiPhone />, path: "/calls", roles: ["branch_manager", "sales"] },
        { name: "Meetings", icon: <FiCalendar />, path: "/meetings", roles: ["branch_manager", "sales"] },
        { name: "Tasks", icon: <FiCheckSquare />, path: "/todos", roles: ["branch_manager", "sales"] },
        { name: "Targets", icon: <FiFlag />, path: "/targets", roles: ["branch_manager", "company_admin"] },
        { name: "Analytics", icon: <FiBarChart2 />, path: "/branch-analytics", roles: ["branch_manager", "company_admin"] },
        { name: "Leaderboard", icon: <FiAward />, path: "/leaderboard", roles: ["branch_manager", "company_admin"] },
        { name: "Calendar", icon: <FiCalendar />, path: "/calendar", roles: ["branch_manager", "sales"] },
        { name: "Reports", icon: <FiPieChart />, path: "/reports", roles: ["super_admin", "company_admin", "branch_manager"] },
        { name: "Automation", icon: <FiCpu />, path: "/automation", roles: ["super_admin", "company_admin"] },
        { name: "Settings", icon: <FiSettings />, path: "/settings", roles: ["super_admin", "company_admin", "branch_manager"] },
    ];

    // Filter menu items based on user role and map path with role prefix
    const menuItems = fullMenuItems
        .filter(item => item.roles.includes(role))
        .map(item => ({
            ...item,
            name: (item.labelMap && item.labelMap[role]) ? item.labelMap[role] : item.name,
            path: item.path === "/dashboard" ? `${rolePrefix}/dashboard` : `${rolePrefix}${item.path}`
        }));

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <aside
            className={`fixed top-0 z-[70] h-full bg-[#1A202C] text-white transition-all duration-500 flex flex-col pt-4 lg:pt-0 border-r border-[#2D3748] shadow-2xl ${isCollapsed ? "w-24" : "w-72"
                } ${isMobileOpen ? "left-0" : "-left-80 lg:left-0"
                }`}
        >
            {/* Brand Section / Identity Node */}
            <div className={`py-12 border-b border-white/5 relative group/brand overflow-hidden flex flex-col items-center ${isCollapsed ? "px-0" : "px-8"}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-50" />
                <div className={`flex items-center gap-5 relative z-10 ${isCollapsed ? "justify-center" : ""}`}>
                    <div className="w-12 h-12 bg-sky-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-sky-500/20 border border-white/10 shrink-0 transform group-hover/brand:rotate-12 transition-all duration-300">
                        {role?.charAt(0).toUpperCase() || "C"}
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col min-w-0 animate-in fade-in duration-300">
                            <span className="text-2xl font-black text-white tracking-tighter leading-none uppercase italic group-hover/brand:text-sky-400 transition-colors">
                                CRM
                            </span>
                            <div className="flex items-center gap-2 mt-2 opacity-60">
                                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {role?.replace("_", " ")}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <div className="mt-12 flex items-center justify-between px-1 relative z-10">
                        <span className="text-[11px] font-black text-[#4A5568] uppercase tracking-[0.4em]">Navigation Menu</span>
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2.5 hover:bg-blue-600/10 rounded-xl text-[#4A5568] hover:text-blue-400 transition-all border border-transparent hover:border-blue-500/20"
                        >
                            <FiChevronLeft size={18} strokeWidth={3} />
                        </button>
                    </div>
                )}

                {isCollapsed && (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="mt-10 w-full flex justify-center p-4 hover:bg-white/5 rounded-2xl text-[#4A5568] hover:text-blue-400 transition-all border border-transparent hover:border-white/5 group"
                    >
                        <FiChevronRight size={24} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                )}
            </div>

            {/* Navigation Matrix */}
            <nav className="flex-1 overflow-y-auto py-10 space-y-3 px-5 custom-scrollbar relative z-10">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center ${isCollapsed ? "justify-center" : "px-6"} py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                                ? "bg-sky-500/10 text-white border border-sky-500/20"
                                : "hover:bg-white/[0.03] text-gray-400 hover:text-white border border-transparent"
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 w-1 h-full bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                            )}
                            <span className={`text-xl ${isActive ? "text-sky-400" : "text-gray-600 group-hover:text-sky-400"} transition-all duration-300`}>
                                {item.icon}
                            </span>
                            {!isCollapsed && (
                                <span className={`ml-4 font-black text-[11px] tracking-widest transition-all duration-300 uppercase ${isActive ? "text-white" : "group-hover:text-white"}`}>{item.name}</span>
                            )}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-4 py-2 bg-gray-900 text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/5 tracking-widest uppercase">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Section */}
            <div className="p-6 border-t border-white/5">
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center ${isCollapsed ? "justify-center" : "px-6"} py-4 rounded-2xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all group font-black text-[11px] tracking-widest uppercase border border-transparent hover:border-red-500/20`}
                >
                    <span className="text-xl rotate-180 group-hover:rotate-0 transition-transform duration-500"><FiLogOut /></span>
                    {!isCollapsed && (
                        <span className="ml-4">Logout</span>
                    )}

                    {isCollapsed && (
                        <div className="absolute left-full ml-4 px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-xl tracking-widest uppercase">
                            Logout
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

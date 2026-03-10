import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    FiLayout, FiTarget, FiUserCheck, FiUser, FiPhone, FiCalendar,
    FiCheckSquare, FiPieChart, FiLogOut, FiChevronLeft, FiChevronRight, FiLayers,
    FiInbox, FiActivity, FiBarChart2, FiBriefcase, FiUsers, FiSettings
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { AuthContext } from "../../context/AuthContext";

const BRANCH_MANAGER_MENU = [
    { name: "Dashboard", icon: <FiLayout />, path: "/branch/dashboard" },
    { name: "My Agenda", icon: <FiCalendar />, path: "/branch/planner" },
    { name: "Analytics", icon: <FiBarChart2 />, path: "/branch/analytics" },
    { name: "Inquiries", icon: <FiInbox />, path: "/branch/inquiries" },
    { name: "Leads", icon: <FiTarget />, path: "/branch/leads" },
    { name: "Accounts", icon: <FiBriefcase />, path: "/branch/customers" },
    { name: "Contacts", icon: <FiUser />, path: "/branch/contacts" },
    { name: "Deals", icon: <FaIndianRupeeSign />, path: "/branch/deals" },
    { name: "Pipeline", icon: <FiLayers />, path: "/branch/pipeline" },
    { name: "Tasks", icon: <FiCheckSquare />, path: "/branch/tasks" },
    { name: "Activities", icon: <FiActivity />, path: "/branch/activities" },
    { name: "Calls", icon: <FiPhone />, path: "/branch/calls" },
    { name: "Meetings", icon: <FiCalendar />, path: "/branch/meetings" },
    { name: "Users", icon: <FiUsers />, path: "/branch/users" },
    { name: "Reports", icon: <FiPieChart />, path: "/branch/reports" },
    { name: "Settings", icon: <FiSettings />, path: "/branch/settings" },
];


const BranchManagerSidebar = ({ isOpen, onClose }) => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const { logout } = useContext(AuthContext);

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={`fixed top-0 left-0 z-[70] h-full bg-[#152039] text-gray-300 transition-all duration-300 flex flex-col border-r border-white/5 shadow-2xl
                ${collapsed ? "w-20" : "w-64"} 
                ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
                <div className="flex items-center justify-between h-20 px-6 border-b border-white/5 bg-[#0F172A]/50 backdrop-blur-md">
                    {!collapsed && <span className="text-xl font-black text-white tracking-widest drop-shadow-sm flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-xs text-white">M</div>
                        BM<span className="text-emerald-500">PRO</span>
                    </span>}
                    <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-all">
                        {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto py-8 space-y-1.5 px-3 custom-scrollbar">
                    {BRANCH_MANAGER_MENU.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group relative
                                    ${isActive
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                        : "hover:bg-white/5 text-slate-400 hover:text-white"
                                    }`}
                            >
                                <span className={`text-xl transition-colors duration-300 ${isActive ? "text-white" : "text-slate-500 group-hover:text-emerald-400"}`}>
                                    {item.icon}
                                </span>
                                {!collapsed && <span className={`ml-4 font-bold text-[13px] tracking-wide ${isActive ? "text-white" : "text-slate-400"}`}>
                                    {item.name}
                                </span>}
                                {isActive && !collapsed && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                )}
                                {collapsed && (
                                    <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-white/10">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5 bg-[#0F172A]/30">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all group"
                    >
                        <FiLogOut className="text-xl group-hover:rotate-12 transition-transform" />
                        {!collapsed && <span className="font-bold text-[13px] tracking-wide">Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default BranchManagerSidebar;

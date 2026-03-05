import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    FiLayout, FiBriefcase, FiDatabase, FiGitPullRequest, FiUsers, FiTarget,
    FiUserCheck, FiPieChart, FiCpu, FiSettings, FiLogOut, FiChevronLeft, FiChevronRight, FiInbox
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { AuthContext } from "../../context/AuthContext";

const COMPANY_ADMIN_MENU = [
    { name: "Dashboard", icon: <FiLayout />, path: "/company/dashboard" },
    { name: "Inquiries", icon: <FiInbox />, path: "/inquiries" },
    { name: "Master", icon: <FiDatabase />, path: "/master" },
    { name: "Branches", icon: <FiGitPullRequest />, path: "/branches" },
    { name: "Users", icon: <FiUsers />, path: "/users" },
    { name: "Leads", icon: <FiTarget />, path: "/leads" },
    { name: "Customers", icon: <FiUserCheck />, path: "/customers" },
    { name: "Deals", icon: <FaIndianRupeeSign />, path: "/deals" },
    { name: "Reports", icon: <FiPieChart />, path: "/reports" },
    { name: "Automation", icon: <FiCpu />, path: "/automation" },
    { name: "Settings", icon: <FiSettings />, path: "/settings" },
];

const CompanyAdminSidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const { logout } = useContext(AuthContext);

    return (
        <aside className={`fixed top-0 left-0 z-[70] h-full bg-green-50 text-gray-700 transition-all duration-300 flex flex-col border-r border-green-100 ${collapsed ? "w-20" : "w-64"}`}>
            <div className="flex items-center justify-between h-16 px-6 border-b border-green-100">
                {!collapsed && <span className="text-xl font-black bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent tracking-tighter">CRM PRO</span>}
                <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-green-100 rounded-lg text-green-600 transition-colors">
                    {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-6 space-y-1.5 px-3">
                {COMPANY_ADMIN_MENU.map(item => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path} className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive ? "bg-green-500 text-white shadow-lg shadow-green-200" : "hover:bg-green-100 text-gray-600 hover:text-green-700"}`}>
                            <span className={`text-xl ${isActive ? "text-white" : "text-gray-400 group-hover:text-green-500"}`}>{item.icon}</span>
                            {!collapsed && <span className="ml-4 font-bold text-sm">{item.name}</span>}
                            {collapsed && (
                                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-green-100">
                <button onClick={logout} className="w-full flex items-center px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all font-bold text-sm">
                    <span className="text-xl rotate-180"><FiLogOut /></span>
                    {!collapsed && <span className="ml-4">Sign Out</span>}
                </button>
            </div>
        </aside>
    );
};

export default CompanyAdminSidebar;

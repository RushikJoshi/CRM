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
    FiInbox
} from "react-icons/fi";

import { FaIndianRupeeSign } from "react-icons/fa6";
import { AuthContext } from "../context/AuthContext";

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role;

    const fullMenuItems = [
        { name: "Dashboard", icon: <FiLayout />, path: "/dashboard", roles: ["super_admin", "company_admin", "branch_manager", "sales"] },
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
        { name: "Calendar", icon: <FiCalendar />, path: "/calendar", roles: ["branch_manager", "sales"] },
        { name: "Reports", icon: <FiPieChart />, path: "/reports", roles: ["super_admin", "company_admin", "branch_manager"], labelMap: { "super_admin": "Platform Reports" } },
        { name: "Automation", icon: <FiCpu />, path: "/automation", roles: ["super_admin", "company_admin"] },
        { name: "Settings", icon: <FiSettings />, path: "/settings", roles: ["super_admin", "company_admin", "branch_manager"] },
    ];

    // Filter menu items based on user role
    const menuItems = fullMenuItems
        .filter(item => item.roles.includes(role))
        .map(item => ({
            ...item,
            name: (item.labelMap && item.labelMap[role]) ? item.labelMap[role] : item.name
        }));

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <aside
            className={`fixed top-0 z-[70] h-full bg-green-50 text-gray-700 transition-all duration-300 flex flex-col pt-4 lg:pt-0 border-r border-green-100 ${isCollapsed ? "w-20" : "w-64"
                } ${isMobileOpen ? "left-0" : "-left-64 lg:left-0"
                }`}
        >
            {/* Logo Section */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-green-100">
                {!isCollapsed && (
                    <span className="text-xl font-black bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent tracking-tighter">
                        CRM PRO
                    </span>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                >
                    {isCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
                </button>
            </div>

            {/* Menu Section */}
            <nav className="flex-1 overflow-y-auto py-6 space-y-1.5 px-3">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                ? "bg-green-500 text-white shadow-lg shadow-green-200"
                                : "hover:bg-green-100 text-gray-600 hover:text-green-700"
                                }`}
                        >
                            <span className={`text-xl ${isActive ? "text-white" : "text-gray-400 group-hover:text-green-500"} transition-colors`}>{item.icon}</span>
                            {!isCollapsed && (
                                <span className="ml-4 font-bold text-sm tracking-tight">{item.name}</span>
                            )}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-xl translate-x-[-10px] group-hover:translate-x-0">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Section */}
            <div className="p-4 border-t border-green-100">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all group font-bold text-sm"
                >
                    <span className="text-xl rotate-180"><FiLogOut /></span>
                    {!isCollapsed && (
                        <span className="ml-4">Term. Session</span>
                    )}
                    {isCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-xl">
                            Logout
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

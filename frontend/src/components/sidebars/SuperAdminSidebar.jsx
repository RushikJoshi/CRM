import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    FiLayout, FiBriefcase, FiPieChart, FiSettings, FiChevronLeft, FiChevronRight, FiCpu
} from "react-icons/fi";

const SUPER_ADMIN_MENU = [
    { name: "Dashboard", icon: <FiLayout />, path: "/superadmin/dashboard" },
    { name: "Companies", icon: <FiBriefcase />, path: "/superadmin/companies" },
    { name: "Platform Reports", icon: <FiPieChart />, path: "/superadmin/reports" },
    { name: "Automation", icon: <FiCpu />, path: "/superadmin/automation" },
    { name: "Settings", icon: <FiSettings />, path: "/superadmin/settings" },
];

const SuperAdminSidebar = ({ isOpen, onClose }) => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={`fixed top-0 left-0 z-[70] h-full bg-slate-50 text-gray-700 transition-all duration-300 flex flex-col border-r border-slate-200 
                ${collapsed ? "w-20" : "w-64"} 
                ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
                    {!collapsed && <span className="text-xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent tracking-tighter">SUPER ADMIN</span>}
                    <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">
                        {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto py-6 space-y-1.5 px-3">
                    {SUPER_ADMIN_MENU.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link key={item.path} to={item.path} className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive ? "bg-green-500 text-white shadow-lg" : "hover:bg-gray-800 text-gray-400 hover:text-white"}`}>
                                <span className="text-xl">{item.icon}</span>
                                {!collapsed && <span className="ml-4 font-bold text-sm">{item.name}</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-4 px-3 py-2 bg-gray-700 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default SuperAdminSidebar;

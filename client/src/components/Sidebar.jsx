import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiGrid,
    FiBriefcase,
    FiGitBranch,
    FiUsers,
    FiTrendingUp,
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
    FiAward,
    FiZap,
    FiCreditCard,
    FiPackage,
    FiActivity,
    FiKey,
    FiFileText,
    FiX,
    FiMail,
    FiSend,
    FiLayout
} from "react-icons/fi";
import { AuthContext, getCurrentUser, USER_DATA_KEYS } from "../context/AuthContext";
import logo from "/src/assets/logos/edupathpro_logo.png";

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);
    const user = getCurrentUser() || {};
    const role = user.role;

    const rolePrefix = (() => {
        if (role === "super_admin") return "/superadmin";
        if (role === "company_admin") return "/company";
        if (role === "branch_manager") return "/branch";
        if (role === "sales") return "/sales";
        return "";
    })();

    const menuGroups = role === "super_admin" ? [
        {
            label: "Overview",
            items: [{ name: "Dashboard", icon: <FiGrid />, path: "/dashboard" }]
        },
        {
            label: "Management",
            items: [
                { name: "Companies", icon: <FiBriefcase />, path: "/companies" },
                { name: "Subscriptions", icon: <FiCreditCard />, path: "/subscriptions" },
                { name: "Portals", icon: <FiLayout />, path: "/test-management/landing" },
                { name: "Courses", icon: <FiCheckSquare />, path: "/test-management/courses" },
                { name: "Platform Users", icon: <FiUsers />, path: "/users" }
            ]
        },
        {
            label: "Insights",
            items: [
                { name: "Analytics", icon: <FiActivity />, path: "/usage-analytics" },
                { name: "System Logs", icon: <FiFileText />, path: "/system-logs" }
            ]
        }
    ] : [
        {
            label: "Overview",
            items: [{ name: "Dashboard", icon: <FiGrid />, path: "/dashboard", roles: ["company_admin", "branch_manager", "sales"] }]
        },
        {
            label: "Operations",
            items: [
                { name: "Branches", icon: <FiGitBranch />, path: "/branches", roles: ["company_admin"] },
                { name: "Users", icon: <FiUsers />, path: "/users", roles: ["company_admin", "branch_manager"] },
                { name: "Inquiries", icon: <FiInbox />, path: "/inquiries", roles: ["company_admin", "branch_manager", "sales"] },
                { name: "Leads", icon: <FiTrendingUp />, path: "/leads", roles: ["company_admin", "branch_manager", "sales"], labelMap: { sales: "My Leads" } },
                // { name: "Prospects", icon: <FiZap />, path: "/prospects", roles: ["company_admin", "branch_manager", "sales"] },
                { name: "Accounts", icon: <FiUserCheck />, path: "/customers", roles: ["company_admin", "branch_manager", "sales"] }
            ]
        },
        {
            label: "Sales & Work",
            items: [
                { name: "Pipeline", icon: <FiBarChart2 />, path: "/pipeline", roles: ["company_admin", "branch_manager", "sales"] },
                { name: "Activity", icon: <FiActivity />, path: "/activities", roles: ["company_admin", "branch_manager", "sales"] },
                { name: "Calendar", icon: <FiCalendar />, path: "/calendar", roles: ["company_admin", "branch_manager", "sales"] },
                { name: "Email Templates", icon: <FiMail />, path: "/email-templates", roles: ["company_admin", "branch_manager", "sales"] },
                { name: "Tasks", icon: <FiCheckSquare />, path: "/tasks", roles: ["company_admin", "branch_manager", "sales"] },
                { name: "Calls", icon: <FiPhone />, path: "/calls", roles: ["company_admin", "branch_manager", "sales"] },
                { name: "Meetings", icon: <FiCalendar />, path: "/meetings", roles: ["company_admin", "branch_manager", "sales"] }
            ]
        },
        {
            label: "Analytics",
            items: [
                { name: "Reports", icon: <FiPieChart />, path: "/reports", roles: ["company_admin", "branch_manager"] },
                { name: "Targets", icon: <FiFlag />, path: "/targets", roles: ["company_admin", "branch_manager"] }
            ]
        }
    ];

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 z-[80] bg-black/20 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside
                className={`fixed lg:relative z-[90] lg:z-10 h-full bg-[var(--sb-bg)] transition-all duration-300 flex flex-col border-r border-[var(--sb-border)] ${
                    isCollapsed ? "w-[var(--sb-collapsed)]" : "w-[var(--sb-width)]"
                } ${isMobileOpen ? "left-0" : "-left-80 lg:left-0"}`}
            >
                {/* Logo Section */}
                <div className={`flex items-center border-b border-[var(--sb-border)] h-[var(--tb-h)] min-h-[var(--tb-h)] ${isCollapsed ? "justify-center" : "px-5 justify-between"}`}>
                    <div className="flex items-center gap-3">
                        <img 
                            src={user?.companyId?.logoUrl || logo} 
                            alt={user?.companyId?.name || "EduPathpro"} 
                            className="w-8 h-8 object-contain shrink-0" 
                        />
                        <div className="flex flex-col">
                            {!isCollapsed && (
                                <span className="text-[14px] font-black text-[#0F172A] tracking-tighter leading-none">
                                    {user?.companyId?.name || "EduPathpro"}
                                </span>
                            )}
                            {!isCollapsed && (
                                <span className="text-[8px] font-black uppercase tracking-[0.05em] text-slate-400 mt-0.5 leading-none">
                                    {user?.companyId?.tagline || "Powered by EduPath"}
                                </span>
                            )}
                        </div>
                    </div>
                    {!isCollapsed && (
                        <button
                            onClick={() => setIsCollapsed(true)}
                            className="p-1.5 rounded-md text-[var(--sb-text)] hover:bg-[var(--sb-hover)] transition-colors opacity-60 hover:opacity-100 hidden lg:block"
                        >
                            <FiChevronLeft size={16} />
                        </button>
                    )}
                    {/* Mobile Close Button */}
                    <button 
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-1.5 rounded-md text-[var(--sb-text)]"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {isCollapsed && (
                    <div className="flex justify-center py-4 border-b border-[var(--sb-border)]">
                        <button
                            onClick={() => setIsCollapsed(false)}
                            className="p-1.5 rounded-md text-[var(--sb-text)] hover:bg-[var(--sb-hover)] transition-colors opacity-60 hover:opacity-100"
                        >
                            <FiChevronRight size={16} />
                        </button>
                    </div>
                )}

                {/* Nav Groups */}
                <nav className="flex-1 overflow-y-auto pt-4 pb-12 px-2.5 custom-scrollbar">
                    {menuGroups.map((group, groupIdx) => {
                        const filteredItems = group.items.filter(item => !item.roles || item.roles.includes(role));
                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={groupIdx} className="mb-6 last:mb-0">
                                {!isCollapsed && (
                                    <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[.09em] text-[var(--sb-text)] opacity-70">
                                        {group.label}
                                    </div>
                                )}
                                <div className="space-y-0.5">
                                    {filteredItems.map((item) => {
                                        const fullPath = item.path === "/dashboard" ? `${rolePrefix}/dashboard` : `${rolePrefix}${item.path}`;
                                        const isActive = location.pathname === fullPath || (fullPath !== '/' && location.pathname.startsWith(fullPath));
                                        return (
                                            <Link
                                                key={item.path}
                                                to={fullPath}
                                                onClick={() => setIsMobileOpen(false)}
                                                className={`relative group flex items-center gap-3 rounded-[12px] py-2.5 px-4 transition-all duration-300 overflow-hidden ${
                                                    isActive
                                                        ? "bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-white font-bold shadow-md shadow-cyan-400/20"
                                                        : "text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B]"
                                                } ${isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : ""}`}
                                            >
                                                <span className={`shrink-0 transition-all duration-300 ${isActive ? "text-white scale-110" : "opacity-60 group-hover:opacity-100"}`}>
                                                    {React.cloneElement(item.icon, { size: 18, strokeWidth: isActive ? 2.5 : 2 })}
                                                </span>
                                                {!isCollapsed && <span className="text-[14px] truncate tracking-tight">{item.labelMap?.[role] || item.name}</span>}


                                                {isCollapsed && (
                                                    <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-[var(--txt)] text-white text-[11px] font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
                                                        {item.labelMap?.[role] || item.name}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

            </aside>
        </>
    );
};

export default Sidebar;

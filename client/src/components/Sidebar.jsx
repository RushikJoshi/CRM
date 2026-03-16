import React, { useContext } from "react";
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
    FiAward,
    FiZap,
    FiCreditCard,
    FiPackage,
    FiActivity,
    FiKey,
    FiFileText,
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { AuthContext, getCurrentUser } from "../context/AuthContext";

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen }) => {
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

    const platformMenuItems = [
        { name: "Dashboard", icon: <FiLayout />, path: "/dashboard" },
        { name: "Companies", icon: <FiBriefcase />, path: "/companies" },
        { name: "Subscriptions", icon: <FiCreditCard />, path: "/subscriptions" },
        { name: "Plans", icon: <FiPackage />, path: "/plans" },
        { name: "Platform Users", icon: <FiUsers />, path: "/users" },
        { name: "Billing", icon: <FiCreditCard />, path: "/billing" },
        { name: "Usage Analytics", icon: <FiActivity />, path: "/usage-analytics" },
        { name: "System Logs", icon: <FiFileText />, path: "/system-logs" },
        { name: "API Keys", icon: <FiKey />, path: "/api-keys" },
        { name: "Settings", icon: <FiSettings />, path: "/settings" },
    ];

    const fullMenuItems = [
        { name: "Dashboard", icon: <FiLayout />, path: "/dashboard", roles: ["company_admin", "branch_manager", "sales"] },
        { name: "Planner", icon: <FiCalendar />, path: "/planner", roles: ["branch_manager", "sales"] },
        { name: "Inquiries", icon: <FiInbox />, path: "/inquiries", roles: ["company_admin", "branch_manager", "sales"] },
        { name: "Master", icon: <FiDatabase />, path: "/master", roles: ["company_admin"] },
        { name: "Branches", icon: <FiGitPullRequest />, path: "/branches", roles: ["company_admin"] },
        { name: "Users", icon: <FiUsers />, path: "/users", roles: ["company_admin", "branch_manager"] },
        { name: "Leads", icon: <FiTarget />, path: "/leads", roles: ["company_admin", "branch_manager", "sales"], labelMap: { sales: "My Leads" } },
        { name: "Prospects", icon: <FiZap />, path: "/prospects", roles: ["company_admin", "branch_manager", "sales"] },
        { name: "Accounts", icon: <FiUserCheck />, path: "/customers", roles: ["company_admin", "branch_manager", "sales"] },
        { name: "Contacts", icon: <FiUser />, path: "/contacts", roles: ["branch_manager"] },
        { name: "Deals", icon: <FaIndianRupeeSign />, path: "/deals", roles: ["company_admin", "branch_manager", "sales"], labelMap: { sales: "My Deals" } },
        { name: "Pipeline", icon: <FiTarget />, path: "/pipeline", roles: ["company_admin", "branch_manager", "sales"] },
        { name: "Calls", icon: <FiPhone />, path: "/calls", roles: ["branch_manager", "sales"] },
        { name: "Meetings", icon: <FiCalendar />, path: "/meetings", roles: ["branch_manager", "sales"] },
        { name: "Tasks", icon: <FiCheckSquare />, path: "/todos", roles: ["branch_manager", "sales"] },
        { name: "Targets", icon: <FiFlag />, path: "/targets", roles: ["branch_manager", "company_admin"] },
        { name: "Analytics", icon: <FiBarChart2 />, path: "/branch-analytics", roles: ["branch_manager", "company_admin"] },
        { name: "Leaderboard", icon: <FiAward />, path: "/leaderboard", roles: ["branch_manager", "company_admin"] },
        { name: "Calendar", icon: <FiCalendar />, path: "/calendar", roles: ["branch_manager", "sales"] },
        { name: "Reports", icon: <FiPieChart />, path: "/reports", roles: ["company_admin", "branch_manager"] },
        { name: "Automation", icon: <FiCpu />, path: "/automation", roles: ["company_admin"] },
        { name: "Settings", icon: <FiSettings />, path: "/settings", roles: ["company_admin", "branch_manager"] },
    ];

    const menuItems = role === "super_admin"
        ? platformMenuItems.map((item) => ({ ...item, path: `${rolePrefix}${item.path}` }))
        : fullMenuItems
            .filter((item) => item.roles.includes(role))
            .map((item) => ({
                ...item,
                name: item.labelMap?.[role] ?? item.name,
                path: item.path === "/dashboard" ? `${rolePrefix}/dashboard` : `${rolePrefix}${item.path}`,
            }));

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <aside
            className={`fixed top-0 z-[70] h-full bg-[#FFFFFF] transition-all duration-300 flex flex-col border-r border-[#E5E7EB] ${
                isCollapsed ? "w-sidebar-collapsed" : "w-sidebar"
            } ${isMobileOpen ? "left-0" : "-left-80 lg:left-0"}`}
        >
            {/* Brand */}
            <div className={`flex flex-col items-center border-b border-[#E5E7EB] ${isCollapsed ? "py-6 px-0" : "py-8 px-6"}`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : "w-full"}`}>
                    <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-semibold text-lg shrink-0">
                        {role?.charAt(0).toUpperCase() || "C"}
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0">
                            <p className="text-lg font-bold text-[#111827] tracking-tight">CRM</p>
                            <p className="text-xs text-[#6B7280] font-medium mt-0.5">{role?.replace("_", " ") ?? ""}</p>
                        </div>
                    )}
                </div>
                {!isCollapsed && (
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(true)}
                        className="mt-4 p-2 rounded-lg text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#111827] transition-colors"
                        aria-label="Collapse sidebar"
                    >
                        <FiChevronLeft size={18} />
                    </button>
                )}
                {isCollapsed && (
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(false)}
                        className="mt-4 p-2 rounded-lg text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#111827] transition-colors"
                        aria-label="Expand sidebar"
                    >
                        <FiChevronRight size={18} />
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-0.5">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`group flex items-center gap-3 rounded-lg py-2.5 px-3 transition-all duration-150 ${
                                isActive
                                    ? "bg-[#EEF2FF] text-[#2563EB] font-semibold"
                                    : "text-[#6B7280] hover:bg-[#F3F4FF] hover:text-[#111827] font-medium"
                            } ${isCollapsed ? "justify-center" : ""}`}
                        >
                            <span className="shrink-0 text-[1.1rem] opacity-90">{item.icon}</span>
                            {!isCollapsed && <span className="truncate text-sm">{item.name}</span>}
                            {isCollapsed && (
                                <span className="absolute left-full ml-2 px-3 py-2 bg-[#111827] text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
                                    {item.name}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-[#E5E7EB]">
                <button
                    type="button"
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 rounded-lg py-2.5 px-3 text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors font-medium text-sm ${isCollapsed ? "justify-center" : ""}`}
                >
                    <FiLogOut size={18} className="shrink-0" />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

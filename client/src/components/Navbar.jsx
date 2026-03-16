import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBell, FiMenu, FiPlus, FiUser, FiBriefcase, FiChevronDown } from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { AuthContext, getCurrentUser } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import API from "../services/api";
import GlobalSearch from "./GlobalSearch";

const Navbar = ({ toggleMobileSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);
    const user = getCurrentUser() || {};
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const base = location.pathname.startsWith("/superadmin")
        ? "/superadmin"
        : location.pathname.startsWith("/company")
        ? "/company"
        : location.pathname.startsWith("/branch")
        ? "/branch"
        : "/sales";

    useEffect(() => {
        if (user.id || user._id) {
            API.get("/notifications/unread")
                .then((res) => setNotifications(res.data?.data || res.data || []))
                .catch(() => {});
        }
    }, [user.id, user._id]);

    const markAsRead = async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
        } catch {
            // ignore
        }
    };

    const handleLogout = () => {
        setShowProfileMenu(false);
        logout?.();
        navigate("/");
    };

    const breadcrumb = (() => {
        const parts = location.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1];
        const label = last ? (last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ")) : "Dashboard";
        return ["Home", label].join(" / ");
    })();

    return (
        <header className="sticky top-0 z-40 h-14 bg-[#F3F4F6] border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <button
                    type="button"
                    onClick={toggleMobileSidebar}
                    className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
                    aria-label="Open menu"
                >
                    <FiMenu size={22} />
                </button>
                <p className="hidden lg:block text-sm text-gray-600 truncate">{breadcrumb}</p>

                <div className="flex-1 max-w-md mx-auto hidden md:block">
                    <GlobalSearch placeholder="Search anything..." />
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {!location.pathname.startsWith("/superadmin") && (
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowQuickCreate((o) => !o)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <FiPlus size={18} />
                            <span className="hidden sm:inline">Quick Create</span>
                        </button>
                        {showQuickCreate && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowQuickCreate(false)}
                                    aria-hidden
                                />
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-[#E5E7EB] shadow-lg z-50 py-1">
                                    <Link
                                        to={`${base}/leads/create`}
                                        onClick={() => setShowQuickCreate(false)}
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#111827] hover:bg-[#F8FAFC]"
                                    >
                                        <FiUser size={16} className="text-[#6B7280]" /> New Lead
                                    </Link>
                                    <Link
                                        to={`${base}/deals/create`}
                                        onClick={() => setShowQuickCreate(false)}
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#111827] hover:bg-[#F8FAFC]"
                                    >
                                        <FaIndianRupeeSign size={16} className="text-[#6B7280]" /> New Deal
                                    </Link>
                                    <Link
                                        to={`${base}/contacts/create`}
                                        onClick={() => setShowQuickCreate(false)}
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#111827] hover:bg-[#F8FAFC]"
                                    >
                                        <FiBriefcase size={16} className="text-[#6B7280]" /> New Contact
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                )}
                <div className="relative">
<button
                            type="button"
                            onClick={() => setShowNotifications((o) => !o)}
                            className="relative p-2.5 rounded-xl text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                            aria-label="Notifications"
                        >
                            <FiBell size={20} />
                            {notifications.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[#F3F4F6]">
                                    {notifications.length > 9 ? "9+" : notifications.length}
                                </span>
                            )}
                        </button>

                    {showNotifications && (
                        <>
                            <div
                                role="button"
                                tabIndex={0}
                                className="fixed inset-0 z-40"
                                onClick={() => setShowNotifications(false)}
                                onKeyDown={(e) => e.key === "Escape" && setShowNotifications(false)}
                                aria-label="Close notifications"
                            />
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#E5E7EB] shadow-lg z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
                                    <span className="text-sm font-semibold text-[#111827]">Notifications</span>
                                    {notifications.length > 0 && (
                                        <span className="text-xs font-medium text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded">
                                            {notifications.length} new
                                        </span>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="py-12 text-center text-sm text-[#6B7280]">
                                            No new notifications
                                        </div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div
                                                key={n._id}
                                                className="px-4 py-3 hover:bg-[#F8FAFC] border-b border-[#E5E7EB] last:border-0"
                                            >
                                                <p className="text-sm font-medium text-[#111827]">{n.title}</p>
                                                <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">{n.message}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-[#6B7280]">
                                                        {n.createdAt && new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => markAsRead(n._id)}
                                                        className="text-xs font-medium text-[#2563EB] hover:underline"
                                                    >
                                                        Mark read
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="h-8 w-px bg-gray-300 hidden sm:block" />

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowProfileMenu((o) => !o)}
                        className="flex items-center gap-2 pl-2"
                    >
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name || "User"}</p>
                            <p className="text-xs text-gray-500 leading-tight capitalize">{(user.role ?? "member").replace("_", " ")}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm shrink-0 shadow-sm">
                            {(user.name || "U").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "U"}
                        </div>
                        <FiChevronDown className="hidden sm:block w-4 h-4 text-gray-500 shrink-0" />
                    </button>

                    {showProfileMenu && (
                        <>
                            <div
                                role="button"
                                tabIndex={0}
                                className="fixed inset-0 z-40"
                                onClick={() => setShowProfileMenu(false)}
                                onKeyDown={(e) => e.key === "Escape" && setShowProfileMenu(false)}
                                aria-label="Close profile menu"
                            />
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name || "User"}</p>
                                    <p className="text-xs text-gray-500 capitalize">{(user.role ?? "member").replace("_", " ")}</p>
                                </div>
                                <div className="py-1">
                                    {/* Placeholder for future profile page */}
                                    <button
                                        type="button"
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            navigate(`${base}/profile`);
                                        }}
                                    >
                                        View profile
                                    </button>
                                </div>
                                <div className="border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;

import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBell, FiMenu, FiPlus, FiUser, FiBriefcase, FiChevronDown, FiMessageSquare, FiSearch } from "react-icons/fi";
import { AuthContext, getCurrentUser } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import API from "../services/api";
import QuickCreate from "./QuickCreate";

const Navbar = ({ toggleMobileSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);
    const user = getCurrentUser() || {};
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [recentMessages, setRecentMessages] = useState([]);
    const [showMessages, setShowMessages] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [search, setSearch] = useState("");

    const base = location.pathname.startsWith("/superadmin") ? "/superadmin" : 
                 location.pathname.startsWith("/company") ? "/company" : 
                 location.pathname.startsWith("/branch") ? "/branch" : "/sales";

    useEffect(() => {
        if (user.id || user._id) {
            API.get("/notifications/unread")
                .then((res) => setNotifications(res.data?.data || res.data || []))
                .catch(() => {});
            
            API.get("/activities/timeline?type=message&limit=5")
                .then((res) => setRecentMessages(res.data?.data || []))
                .catch(() => {});
        }
    }, [user.id, user._id]);

    const markAsRead = async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
        } catch {}
    };

    const handleLogout = () => {
        setShowProfileMenu(false);
        logout?.();
        navigate("/");
    };

    const breadcrumbs = (() => {
        const path = location.pathname.split("/").filter(Boolean);
        return path.map((part, i) => {
            const url = `/${path.slice(0, i + 1).join("/")}`;
            const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
            return { label, url };
        });
    })();

    return (
        <header className="sticky top-0 z-40 h-[var(--tb-h)] bg-white border-b border-[var(--border)] flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <button
                    type="button"
                    onClick={toggleMobileSidebar}
                    className="lg:hidden p-1.5 rounded-md text-[var(--txt3)] hover:bg-[var(--sb-hover)] transition-colors"
                >
                    <FiMenu size={18} />
                </button>
                
                {/* Breadcrumbs */}
                <nav className="hidden md:flex items-center gap-1.5 text-[12px] font-medium text-[var(--txt3)] overflow-hidden">
                    <Link to="/" className="hover:text-[var(--indigo)] transition-colors">Home</Link>
                    {breadcrumbs.map((bc, i) => (
                        <React.Fragment key={bc.url}>
                            <span className="opacity-40">/</span>
                            <Link 
                                to={bc.url} 
                                className={`hover:text-[var(--indigo)] transition-colors truncate ${i === breadcrumbs.length - 1 ? "text-[var(--txt)] font-semibold" : ""}`}
                            >
                                {bc.label}
                            </Link>
                        </React.Fragment>
                    ))}
                </nav>
            </div>

            {/* Center Search */}
            <div className="flex-1 max-w-sm hidden lg:block mx-4">
                <div className="relative group">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--txt4)] group-focus-within:text-[var(--indigo)] transition-colors" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search anything..." 
                        className="w-full h-8 pl-9 pr-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r)] text-[13px] outline-none focus:bg-white focus:border-[var(--indigo)] focus:ring-[3px] focus:ring-[rgba(99,102,241,.1)] transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {!location.pathname.startsWith("/superadmin") && <QuickCreate />}

                {/* Messages */}
                <div className="relative">
                    <button
                        onClick={() => setShowMessages(!showMessages)}
                        className="w-8 h-8 flex items-center justify-center rounded-[var(--r)] border border-[var(--border)] text-[var(--txt3)] hover:bg-[var(--indigo-l)] hover:text-[var(--indigo)] transition-all"
                    >
                        <FiMessageSquare size={14} />
                    </button>
                    {showMessages && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMessages(false)} />
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-[var(--r-md)] border border-[var(--border)] shadow-[var(--sh-md)] z-50 overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface2)] flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Messages</span>
                                    <Link to={`${base}/activities?type=message`} className="text-[10px] font-bold text-[var(--indigo)] hover:underline">View All</Link>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {recentMessages.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-[var(--txt4)]">No recent messages</div>
                                    ) : (
                                        recentMessages.map((msg) => (
                                            <div key={msg._id} className="p-3 hover:bg-[var(--surface2)] border-b last:border-0 cursor-pointer" onClick={() => navigate(`${base}/leads/${msg.leadId}`)}>
                                                <p className="text-[12px] font-bold text-[var(--txt)] line-clamp-1">{msg.note || msg.title}</p>
                                                <p className="text-[10px] text-[var(--txt3)] mt-0.5">{new Date(msg.createdAt || msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="w-8 h-8 flex items-center justify-center rounded-[var(--r)] border border-[var(--border)] text-[var(--txt3)] hover:bg-[var(--indigo-l)] hover:text-[var(--indigo)] transition-all"
                    >
                        <FiBell size={14} />
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--danger)] text-white text-[9px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                                {notifications.length > 9 ? "9+" : notifications.length}
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-[var(--r-md)] border border-[var(--border)] shadow-[var(--sh-md)] z-50 overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface2)]">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">Notifications</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-[var(--txt4)]">No new notifications</div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div key={n._id} className="p-3 border-b last:border-0 hover:bg-[var(--surface2)]">
                                                <p className="text-[12px] font-bold text-[var(--txt)]">{n.title}</p>
                                                <p className="text-[11px] text-[var(--txt3)] mt-0.5 line-clamp-2">{n.message}</p>
                                                <button onClick={() => markAsRead(n._id)} className="mt-2 text-[10px] font-bold text-[var(--indigo)] hover:underline">Mark read</button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="h-4 w-px bg-[var(--border2)] mx-1 hidden sm:block" />

                {/* User Chip */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2.5 pl-1.5 group"
                    >
                        <div className="hidden sm:block text-right">
                            <p className="text-[12px] font-bold text-[var(--txt)] leading-none mb-0.5 group-hover:text-[var(--indigo)] transition-colors">{user.name}</p>
                            <p className="text-[10px] font-medium text-[var(--txt3)] leading-none capitalize opacity-70">{(user.role ?? "member").replace("_", " ")}</p>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--indigo)] to-[var(--indigo-b)] text-white flex items-center justify-center font-bold text-[10px] shadow-sm ring-2 ring-white ring-offset-1 ring-offset-[var(--border)]">
                            {(user.name || "U").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                    </button>

                    {showProfileMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-[var(--r-md)] border border-[var(--border)] shadow-[var(--sh-md)] z-50 overflow-hidden">
                                <div className="p-4 border-b border-[var(--border)] bg-[var(--surface2)]">
                                    <p className="text-[12px] font-bold text-[var(--txt)] truncate">{user.name}</p>
                                    <p className="text-[10px] text-[var(--txt3)] capitalize">{(user.role ?? "member").replace("_", " ")}</p>
                                </div>
                                <div className="py-1">
                                    <button onClick={() => { setShowProfileMenu(false); navigate(`${base}/profile`); }} className="w-full text-left px-4 py-2 text-[12.5px] text-[var(--txt2)] hover:bg-[var(--surface2)] transition-colors">My Profile</button>
                                    <button onClick={() => { setShowProfileMenu(false); navigate(`${base}/settings`); }} className="w-full text-left px-4 py-2 text-[12.5px] text-[var(--txt2)] hover:bg-[var(--surface2)] transition-colors">Settings</button>
                                </div>
                                <div className="border-t border-[var(--border)] py-1">
                                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-[12.5px] text-[var(--danger)] hover:bg-[var(--danger-l)] transition-colors font-semibold">Sign out</button>
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

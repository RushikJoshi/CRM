import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBell, FiMenu, FiPlus, FiUser, FiBriefcase, FiChevronDown, FiMessageSquare, FiSearch, FiSettings, FiLogOut } from "react-icons/fi";
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

    const openMessageContext = (msg) => {
        if (!msg?.leadId) return;
        const entityBase = msg.entityType === "INQUIRY" ? "inquiries" : "leads";
        navigate(`${base}/${entityBase}/${msg.leadId}`);
        setShowMessages(false);
    };

    const handleLogout = () => {
        setShowProfileMenu(false);
        logout?.();
        navigate("/");
    };

    const breadcrumbs = (() => {
        const fullPathParts = location.pathname.split("/").filter(Boolean);
        const roles = ["superadmin", "company", "branch", "sales", "super_admin", "company_admin", "branch_manager"];
        
        const crumbs = [];
        let currentUrl = "";

        fullPathParts.forEach((part) => {
            currentUrl += `/${part}`;
            const isRole = roles.includes(part.toLowerCase().replace(/_/g, ""));
            const isId = /^[0-9a-fA-F]{24}$/.test(part);

            // Skip Roles and IDs in breadcrumbs
            if (!isRole && !isId) {
                const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
                crumbs.push({ label, url: currentUrl });
            }
        });
        return crumbs;
    })();

    return (
        <header className="sticky top-0 z-40 h-[var(--tb-h)] min-h-[var(--tb-h)] bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shadow-sm shadow-slate-200/50">
            <div className="flex items-center gap-6 min-w-0 flex-1 h-full">
                <button
                    type="button"
                    onClick={toggleMobileSidebar}
                    className="lg:hidden p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-[#38BDF8] transition-all"
                >
                    <FiMenu size={20} />
                </button>
                
                {/* Breadcrumbs */}
                <nav className="hidden md:flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest h-full">
                    {breadcrumbs.map((bc, i) => (
                        <React.Fragment key={`${bc.url}-${i}`}>
                            {i > 0 && <span className="opacity-20 text-[14px] font-light">/</span>}
                            <Link 
                                to={bc.url} 
                                className={`hover:text-[#38BDF8] transition-colors truncate flex items-center ${i === breadcrumbs.length - 1 ? "text-[#0f172a] font-black" : "opacity-60"}`}
                            >
                                {bc.label}
                            </Link>
                        </React.Fragment>
                    ))}
                </nav>
            </div>

            {/* Center Search */}
            <div className="flex-1 max-w-sm hidden lg:flex items-center mx-8 h-full">
                <div className="relative group w-full">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#38BDF8] transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search system resources..." 
                        className="w-full h-[42px] pl-11 pr-4 bg-slate-50/50 border border-transparent rounded-full text-[13px] font-medium outline-none focus:bg-white focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/5 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>


            <div className="flex items-center gap-4 sm:gap-6 shrink-0 h-full">
                {!location.pathname.startsWith("/superadmin") && <QuickCreate />}

                {/* Messages */}
                <div className="relative flex items-center h-full">
                    <button
                        onClick={() => setShowMessages(!showMessages)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50/50 border border-slate-100 text-slate-400 hover:text-[#38BDF8] hover:bg-white hover:border-[#38BDF8] transition-all shadow-sm hover:shadow-cyan-200/50"
                    >
                        <FiMessageSquare size={18} />
                    </button>
                    {showMessages && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMessages(false)} />
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden animate-fade-in">
                                <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Recent Messages</span>
                                    <Link to={`${base}/activities?type=message`} className="text-[11px] font-bold text-[#38BDF8] hover:underline">View All</Link>
                                </div>
                                <div className="max-h-[320px] overflow-y-auto">
                                    {recentMessages.length === 0 ? (
                                        <div className="py-12 text-center text-xs text-slate-400 font-medium">No recent messages</div>
                                    ) : (
                                        recentMessages.map((msg, i) => (
                                            <div key={msg._id || i} className="p-4 hover:bg-slate-50/50 border-b border-slate-50 last:border-0 cursor-pointer transition-colors" onClick={() => openMessageContext(msg)}>
                                                <p className="text-[13px] font-bold text-slate-700 line-clamp-1">{msg.note || msg.title}</p>
                                                <p className="text-[11px] text-slate-400 mt-1 font-medium">{new Date(msg.createdAt || msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Notifications */}
                <div className="relative flex items-center h-full">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50/50 border border-slate-100 text-slate-400 hover:text-[#38BDF8] hover:bg-white hover:border-[#38BDF8] transition-all shadow-sm hover:shadow-cyan-200/50"
                    >
                        <FiBell size={18} />
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                {notifications.length > 9 ? "9+" : notifications.length}
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden animate-fade-in">
                                <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/30">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">System Notifications</span>
                                </div>
                                <div className="max-h-[320px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="py-12 text-center text-xs text-slate-400 font-medium">No new notifications</div>
                                    ) : (
                                        notifications.map((n, i) => (
                                            <div key={n._id || i} className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                                <p className="text-[13px] font-bold text-slate-700">{n.title}</p>
                                                <p className="text-[12px] text-slate-400 mt-1 font-medium line-clamp-2">{n.message}</p>
                                                <button onClick={() => markAsRead(n._id)} className="mt-3 text-[11px] font-bold text-[#38BDF8] hover:underline">Mark read</button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="h-6 w-px bg-slate-100 mx-2 hidden sm:block self-center" />

                {/* User Chip */}
                <div className="relative flex items-center h-full">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 pl-2 group h-full"
                    >
                        <div className="hidden sm:block text-right">
                            <p className="text-[13px] font-black text-slate-700 leading-none group-hover:text-[#38BDF8] transition-colors poppins tracking-tight uppercase">{user.name}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-400 group-hover:border-[#38BDF8] group-hover:text-[#38BDF8] transition-all ring-1 ring-slate-100 shrink-0 overflow-hidden">
                            {user.profilePhoto ? (
                                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <FiUser size={18} strokeWidth={2.5} />
                            )}
                        </div>
                    </button>

                    {showProfileMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden animate-fade-in">
                                <div className="p-5 border-b border-slate-50 bg-slate-50/20">
                                    <p className="text-[14px] font-bold text-slate-800 truncate poppins tracking-tight">{user.name}</p>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">{(user.role ?? "member").replace("_", " ")}</p>
                                </div>
                                <div className="py-2">
                                    <button onClick={() => { setShowProfileMenu(false); navigate(`${base}/profile`); }} className="w-full text-left px-5 py-3 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-3"><FiUser className="opacity-40" size={16} /> My Profile</button>
                                    <button onClick={() => { setShowProfileMenu(false); navigate(`${base}/settings`); }} className="w-full text-left px-5 py-3 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-3"><FiSettings className="opacity-40" size={16} /> Settings</button>
                                </div>
                                <div className="border-t border-slate-50 py-2">
                                    <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-[13px] font-bold text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-3"><FiLogOut className="opacity-70" size={16} /> Sign out</button>
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

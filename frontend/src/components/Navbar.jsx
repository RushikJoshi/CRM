import React, { useState, useContext, useEffect } from "react";
import { FiBell, FiMenu, FiSearch, FiMessageSquare, FiPower, FiArrowUpRight } from "react-icons/fi";
import { AuthContext, getCurrentUser } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

const Navbar = ({ toggleMobileSidebar }) => {
    const { logout } = useContext(AuthContext);
    const location = useLocation();
    // ✅ Read user from path-isolated session key (never bleeds cross-tab)
    const user = getCurrentUser() || {};
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (user.id || user._id) fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await API.get("/notifications/unread");
            setNotifications(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const markAsRead = async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (err) { console.error(err); }
    };

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }
        try {
            const res = await API.get(`/search?q=${val}`);
            setSearchResults(res.data.data || res.data || []);
            setShowResults(true);
        } catch (err) {
            console.error(err);
        }
    };

    const getPageTitle = () => {
        const path = location.pathname.split("/")[2] || location.pathname.split("/")[1] || "Home";
        return path.charAt(0).toUpperCase() + path.slice(1);
    };

    const handleLogout = () => { logout(); };

    return (
        <header className="h-20 bg-white border-b border-[#E5EAF2] sticky top-0 z-40 flex items-center justify-between px-8 shadow-sm backdrop-blur-md bg-white/80">
            {/* Page Title & Search */}
            <div className="flex items-center gap-6">
                <button
                    onClick={toggleMobileSidebar}
                    className="lg:hidden p-2 text-[#718096] hover:bg-slate-50 rounded-xl transition-all"
                >
                    <FiMenu size={24} />
                </button>
                <div className="hidden lg:block">
                    <h1 className="text-[14px] font-black uppercase tracking-[0.2em] text-[#A0AEC0] mb-0.5">Current View</h1>
                    <h2 className="text-xl font-black text-[#1A202C] tracking-tight">{getPageTitle()}</h2>
                </div>

                {/* Search Bar */}
                <div className="hidden md:flex flex-1 max-w-xl relative ml-12">
                    <div className="flex items-center bg-[#F4F7FB] px-5 py-3 rounded-2xl text-[#1A202C] w-[400px] focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:bg-white focus-within:border-blue-200 border border-transparent transition-all shadow-sm group">
                        <FiSearch className="text-[#A0AEC0] shrink-0 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find records, tasks or notes..."
                            className="bg-transparent border-none outline-none ml-4 text-sm w-full font-bold text-[#1A2020] placeholder-[#A0AEC0]"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onBlur={() => setTimeout(() => setShowResults(false), 200)}
                            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                        />
                    </div>
                </div>
            </div>

            {/* Right Side Icons & Avatar */}
            <div className="flex items-center gap-6">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`p-3 rounded-2xl transition-all relative ${showNotifications ? "bg-blue-50 text-blue-600" : "text-[#718096] hover:bg-slate-50 hover:text-[#1A202C]"}`}
                    >
                        <FiBell size={20} />
                        {notifications.length > 0 && (
                            <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-4 w-96 bg-white rounded-[24px] shadow-2xl border border-[#E5EAF2] overflow-hidden z-50 animate-in zoom-in-95 duration-200">
                            <div className="px-8 py-6 bg-slate-50/50 border-b border-[#E5EAF2] flex items-center justify-between">
                                <h3 className="text-[11px] font-black text-[#718096] uppercase tracking-widest">Notification Center</h3>
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{notifications.length} Unread</span>
                            </div>
                            <div className="max-h-[450px] overflow-y-auto divide-y divide-[#F0F2F5]">
                                {notifications.length > 0 ? notifications.map((n) => (
                                    <div key={n._id} className="p-6 hover:bg-slate-50 transition-colors group relative">
                                        <div className="flex flex-col gap-2">
                                            <p className="text-[14px] font-bold text-[#1A202C] leading-snug">{n.title}</p>
                                            <p className="text-[12px] text-[#718096] font-medium leading-relaxed">{n.message}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                <p className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest">{new Date(n.createdAt).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => markAsRead(n._id)}
                                            className="absolute top-6 right-6 p-2 text-[#A0AEC0] hover:text-red-500 transition-colors bg-white border border-[#E5EAF2] rounded-lg shadow-sm"
                                        >
                                            <FiPower size={11} className="rotate-90" />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="p-16 text-center flex flex-col items-center justify-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center text-[#CBD5E0]"><FiBell size={32} /></div>
                                        <p className="text-[11px] font-bold text-[#A0AEC0] uppercase tracking-widest">All clear here!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-10 w-[1px] bg-[#E5EAF2] hidden sm:block"></div>

                {/* User Profile */}
                <div className="flex items-center gap-4 group cursor-pointer pr-2">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-black text-[#1A202C] leading-none group-hover:text-blue-600 transition-colors">{user.name || "Sales Pro"}</p>
                        <p className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest mt-2">{user.role?.replace("_", " ") || "Member"}</p>
                    </div>
                    <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-[#3169E1] to-[#60A5FA] p-[2.5px] shadow-lg shadow-blue-500/20 group-hover:scale-105 group-hover:rotate-2 transition-all duration-300">
                        <div className="w-full h-full bg-white rounded-[15px] flex items-center justify-center text-blue-600 font-black text-lg">
                            {user.name?.charAt(0) || "U"}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-3 text-[#A0AEC0] hover:bg-red-50 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-100"
                >
                    <FiPower size={22} strokeWidth={2.5} />
                </button>
            </div>
        </header>
    );
};

export default Navbar;

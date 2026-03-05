import React, { useState, useContext, useEffect } from "react";
import { FiBell, FiMenu, FiSearch, FiMessageSquare, FiPower, FiArrowUpRight } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

const Navbar = ({ toggleMobileSidebar }) => {
    const { logout } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Simple Breadcrumb/Title logic
    const getPageTitle = () => {
        const path = location.pathname.split("/")[1];
        if (!path) return "Home";
        return path.charAt(0).toUpperCase() + path.slice(1);
    };

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (user.id) fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await API.get("/notifications/unread");
            setNotifications(res.data.data || []);
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

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-40 flex items-center justify-between px-6 shadow-sm">
            {/* Page Title & Search */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleMobileSidebar}
                    className="lg:hidden p-2 text-gray-500 hover:bg-green-50 rounded-lg transition-colors"
                >
                    <FiMenu size={24} />
                </button>
                <h1 className="text-xl font-black text-gray-900 hidden sm:block w-32 truncate tracking-tight">
                    {getPageTitle()}
                </h1>

                {/* Search Bar - Hidden on Mobile */}
                <div className="hidden md:flex flex-1 max-w-xl relative ml-8">
                    <div className="flex items-center bg-gray-50 px-5 py-2.5 rounded-2xl text-gray-500 w-full focus-within:ring-4 focus-within:ring-green-400/10 focus-within:bg-white focus-within:border-green-200 border border-transparent transition-all shadow-sm">
                        <FiSearch className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Find records, leads, or deals..."
                            className="bg-transparent border-none outline-none ml-3 text-sm w-full font-bold text-gray-700 placeholder-gray-400"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onBlur={() => setTimeout(() => setShowResults(false), 200)}
                            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                        />
                    </div>

                    {showResults && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Knowledge Pulse</span>
                                <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full">{searchResults.length} Hits</span>
                            </div>
                            {searchResults.map((res, i) => (
                                <button
                                    key={i}
                                    onClick={() => { navigate(res.link); setShowResults(false); }}
                                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-green-50 transition-colors border-b last:border-0 border-gray-50 group"
                                >
                                    <div className="text-left">
                                        <p className="text-sm font-black text-gray-800 group-hover:text-green-600 transition-colors">{res.name}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{res.type}</p>
                                    </div>
                                    <FiArrowUpRight className="text-gray-300 group-hover:text-green-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side Icons & Avatar */}
            <div className="flex items-center gap-3 md:gap-8">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2.5 text-gray-400 hover:bg-green-50 hover:text-green-600 rounded-xl transition-all group"
                    >
                        <FiBell size={20} />
                        {notifications.length > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-gray-50 overflow-hidden z-50 animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Signal Intelligence</h3>
                                <span className="text-[9px] font-black text-green-600 bg-green-100/50 px-2 py-0.5 rounded-md">{notifications.length} Pending</span>
                            </div>
                            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                                {notifications.length > 0 ? notifications.map((n) => (
                                    <div key={n._id} className="p-5 hover:bg-gray-50 transition-colors group relative">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-black text-gray-800 leading-tight">{n.title}</p>
                                            <p className="text-[11px] text-gray-400 font-bold leading-relaxed">{n.message}</p>
                                            <p className="text-[8px] font-black text-gray-300 uppercase mt-2">{new Date(n.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                        <button
                                            onClick={() => markAsRead(n._id)}
                                            className="absolute top-5 right-5 p-1 text-gray-300 hover:text-green-500 transition-colors"
                                        >
                                            <FiPower size={12} className="rotate-90" />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200"><FiBell size={24} /></div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Dormant Corridor</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button className="hidden sm:block p-2.5 text-gray-400 hover:bg-green-50 hover:text-green-600 rounded-xl transition-all">
                    <FiMessageSquare size={20} />
                </button>

                <div className="h-8 w-[1px] bg-gray-100 hidden sm:block"></div>

                {/* User Profile */}
                <div className="flex items-center gap-4 cursor-pointer group">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-black text-gray-900 leading-none group-hover:text-green-600 transition-colors">{user.name || "Anonymous"}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">{user.role?.replace("_", " ") || "Guest"}</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-green-600 to-green-500 p-[2px] shadow-lg shadow-green-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-green-600 font-black text-lg uppercase">
                            <span>{user.name?.charAt(0) || "?"}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all sm:hidden"
                >
                    <FiPower size={22} />
                </button>
            </div>
        </header>
    );
};

export default Navbar;

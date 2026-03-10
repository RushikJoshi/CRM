import { useEffect, useState } from "react";
import API from "../services/api";
import { FiTrendingUp, FiActivity, FiSearch, FiClock, FiPlus, FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";

function Activities() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchActivities = async () => {
        try {
            const res = await API.get("/activities/timeline");
            setActivities(res.data?.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const filteredActivities = activities.filter(a =>
        a.title?.toLowerCase().includes(search.toLowerCase()) ||
        a.type?.toLowerCase().includes(search.toLowerCase())
    );

    const getActivityColor = (type) => {
        const t = String(type).toLowerCase();
        if (t === "call") return "bg-blue-50 text-blue-600 border-blue-100";
        if (t === "email") return "bg-purple-50 text-purple-600 border-purple-100";
        if (t === "meeting") return "bg-emerald-50 text-emerald-600 border-emerald-100";
        if (t === "note") return "bg-amber-50 text-amber-600 border-amber-100";
        if (t === "deal") return "bg-indigo-50 text-indigo-600 border-indigo-100";
        if (t === "lead") return "bg-rose-50 text-rose-600 border-rose-100";
        if (t === "task") return "bg-orange-50 text-orange-600 border-orange-100";
        if (t === "system") return "bg-emerald-50 text-emerald-600 border-emerald-100";
        return "bg-gray-50 text-gray-600 border-gray-100";
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Activities</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">
                        Track log of activities across your leads and deals.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group flex-1 lg:w-64">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search activity log..."
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 space-y-8">
                    {loading ? (
                        <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-[6px] border-emerald-50 border-t-emerald-500 rounded-full animate-spin" />
                            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Syncing Activity Timeline...</p>
                        </div>
                    ) : filteredActivities.length === 0 ? (
                        <div className="py-20 text-center">
                            <FiActivity className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No activity logged yet</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-gray-100 ml-6 pl-10 space-y-12 pb-10">
                            {filteredActivities.map((activity, idx) => (
                                <div key={activity.id || idx} className="relative group">
                                    <div className={`absolute -left-[3.15rem] top-0 w-10 h-10 rounded-2xl shadow-xl flex items-center justify-center border-2 border-white ${getActivityColor(activity.type)}`}>
                                        <FiTrendingUp size={16} />
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-gray-900 group-hover:text-emerald-600 transition-colors">{activity.title}</h3>
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getActivityColor(activity.type)}`}>
                                                    {activity.type}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <FiClock size={12} />
                                                {new Date(activity.date).toLocaleString()}
                                                {activity.user && <span className="text-gray-300 ml-2 italic">— Logic and execution by {activity.user}</span>}
                                            </p>
                                        </div>
                                        <Link to={activity.type === 'deal' ? `/company/deals` : `/company/leads`} className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-400 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-500 transition-all active:scale-95 group-hover:bg-emerald-50 group-hover:text-emerald-600">
                                            View Details <FiArrowRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Activities;

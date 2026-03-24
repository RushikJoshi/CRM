import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../services/api";
import { FiSearch, FiArrowRight, FiInfo } from "react-icons/fi";
import Pagination from "../components/Pagination";

function Activities() {
    const [searchParams] = useSearchParams();
    const typeFilter = searchParams.get("type");
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize] = useState(15);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const url = typeFilter ? `/activities/timeline?type=${typeFilter}` : "/activities/timeline";
            const res = await API.get(url);
            setActivities(res.data?.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [typeFilter]);

    const filteredActivities = activities.filter(a =>
        a.title?.toLowerCase().includes(search.toLowerCase()) ||
        a.type?.toLowerCase().includes(search.toLowerCase()) ||
        a.user?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredActivities.length / pageSize);
    const paginatedActivities = filteredActivities.slice((page - 1) * pageSize, page * pageSize);

    const getActivityStyle = (type) => {
        const t = String(type).toLowerCase();
        if (t.includes('lead')) return "text-emerald-600 bg-emerald-50 border-emerald-100";
        if (t.includes('deal')) return "text-blue-600 bg-blue-50 border-blue-100";
        if (t.includes('task')) return "text-orange-600 bg-orange-50 border-orange-100";
        return "text-gray-600 bg-gray-50 border-gray-100";
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Consolidated Action Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative group w-full md:w-96">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search activity by title, user or type..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg outline-none focus:bg-white focus:border-indigo-300 transition-all font-bold text-gray-700 text-xs"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        Total: {filteredActivities.length} logs
                    </span>
                </div>
            </div>

            {/* Excel Style Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                                <th className="px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Activity Detail</th>
                                <th className="px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Executed By</th>
                                <th className="px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin" />
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Syncing Logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedActivities.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">No matching activities found</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedActivities.map((activity, idx) => (
                                    <tr key={activity.id || idx} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <p className="text-[12px] font-bold text-gray-700 tracking-tight">
                                                {new Date(activity.date).toLocaleDateString()}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                        <td className="px-6 py-3">
                                            <p className="text-[13px] font-bold text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">
                                                {activity.title}
                                            </p>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getActivityStyle(activity.type)}`}>
                                                {activity.type?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                                                {activity.user || "SYSTEM"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <Link 
                                                to={activity.type === 'deal' ? `/company/deals` : `/company/leads`}
                                                className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest inline-flex items-center gap-1"
                                            >
                                                Details <FiArrowRight size={12} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="mt-4">
                    <Pagination 
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        total={filteredActivities.length}
                        pageSize={pageSize}
                    />
                </div>
            )}
        </div>
    );
}

export default Activities;

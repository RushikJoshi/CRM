import React, { useEffect, useState } from "react";
import {
    FiClock, FiPhone, FiMail, FiCalendar, FiFileText,
    FiMessageSquare, FiUser, FiInfo, FiLayers, FiCheckCircle
} from "react-icons/fi";
import API from "../services/api";
import Pagination from "./Pagination";

const ICON_MAP = {
    lead: { icon: <FiUser />, color: "bg-blue-100 text-blue-600 border-blue-200" },
    deal: { icon: <FiLayers />, color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
    call: { icon: <FiPhone />, color: "bg-green-100 text-green-600 border-green-200" },
    meeting: { icon: <FiCalendar />, color: "bg-indigo-100 text-indigo-600 border-indigo-200" },
    task: { icon: <FiCheckCircle />, color: "bg-orange-100 text-orange-600 border-orange-200" },
    note: { icon: <FiFileText />, color: "bg-amber-100 text-amber-600 border-amber-200" },
    message: { icon: <FiMessageSquare />, color: "bg-pink-100 text-pink-600 border-pink-200" },
    system: { icon: <FiInfo />, color: "bg-gray-100 text-gray-600 border-gray-200" },
    deal_stage_changed: { icon: <FiLayers />, color: "bg-purple-100 text-purple-600 border-purple-200" },
    lead_stage_changed: { icon: <FiLayers />, color: "bg-violet-100 text-violet-600 border-violet-200" },
    email: { icon: <FiMail />, color: "bg-red-100 text-red-600 border-red-200" },
};

const PAGE_SIZE = 10;
const ActivityTimeline = ({ leadId, customerId, dealId, pageSize = PAGE_SIZE }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [page, setPage] = useState(1);

    const fetchTimeline = async () => {
        setLoading(true);
        setError(false);
        try {
            let url = "/activities/timeline?";
            if (leadId) url += `leadId=${leadId}`;
            else if (customerId) url += `customerId=${customerId}`;
            else if (dealId) url += `dealId=${dealId}`;

            const res = await API.get(url);
            setActivities(res.data?.data || []);
        } catch (err) {
            console.error("Timeline error:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (leadId || customerId || dealId) fetchTimeline();
        else setLoading(false);
    }, [leadId, customerId, dealId]);
    useEffect(() => setPage(1), [activities.length]);

    const size = Math.max(1, Number(pageSize) || PAGE_SIZE);
    const totalPages = Math.ceil(activities.length / size) || 1;
    const paginated = activities.slice((page - 1) * size, page * size);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-emerald-50 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading History...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-100">
                <FiClock className="mx-auto text-gray-200 mb-4" size={40} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No activity history yet.</p>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-100">
                <FiClock className="mx-auto text-gray-200 mb-4" size={40} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No activities logged yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative pl-8 space-y-6 animate-in fade-in duration-700">
                {/* Vertical Line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500/20 via-blue-500/20 to-transparent" />

                {paginated.map((activity, index) => {
                const config = ICON_MAP[activity.type] || ICON_MAP.system;
                const date = new Date(activity.date);

                return (
                    <div key={activity.id + index} className="relative group">
                        {/* Status Icon Indicator */}
                        <div className={`absolute -left-[41px] top-0 w-8 h-8 rounded-xl border-4 border-white ${config.color} flex items-center justify-center text-xs shadow-sm z-10 transition-transform group-hover:scale-110`}>
                            {config.icon}
                        </div>

                        {/* Content */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all group-hover:border-emerald-100">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-black text-gray-900 text-sm tracking-tight leading-none group-hover:text-emerald-600 transition-colors">
                                    {activity.title}
                                </h4>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0 ml-4">
                                    {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-400 font-black">
                                    {activity.user?.charAt(0) || "S"}
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest uppercase">
                                    {activity.user || "System"}
                                </span>
                            </div>
                        </div>
                    </div>
                );
                })}
            </div>
            {totalPages > 1 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    total={activities.length}
                    pageSize={size}
                />
            )}
        </div>
    );
};

export default ActivityTimeline;

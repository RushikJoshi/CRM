import React, { useEffect, useState } from "react";
import API from "../services/api";
import { FiClock, FiPhone, FiCalendar, FiCheckSquare, FiUserPlus, FiTarget, FiFileText, FiMessageCircle } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

const ActivityTimeline = ({ leadId, customerId, dealId }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTimeline = async () => {
        try {
            let url = "/activities/timeline?";
            if (leadId) url += `leadId=${leadId}&`;
            if (customerId) url += `customerId=${customerId}&`;
            if (dealId) url += `dealId=${dealId}&`;

            const res = await API.get(url);
            setActivities(res.data);
        } catch (err) {
            console.error("Timeline error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimeline();
    }, [leadId, customerId, dealId]);

    const getIcon = (type) => {
        switch (type) {
            case 'call': return <FiPhone className="text-orange-500" />;
            case 'meeting': return <FiCalendar className="text-green-500" />;
            case 'task': return <FiCheckSquare className="text-emerald-500" />;
            case 'lead': return <FiUserPlus className="text-green-600" />;
            case 'deal': return <FiTarget className="text-orange-600" />;
            case 'note': return <FiFileText className="text-gray-500" />;
            case 'message': return <FiMessageCircle className="text-blue-500" />;
            default: return <FiClock className="text-gray-400" />;
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest text-[10px]">Reconstructing History Protocol...</div>;

    if (activities.length === 0) return (
        <div className="p-16 text-center bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-200 mx-auto mb-4 shadow-sm border border-gray-50">
                <FiClock size={32} />
            </div>
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">No activity recorded in this cluster.</p>
        </div>
    );

    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-50 before:to-transparent">
            {activities.map((act, i) => (
                <div key={i} className="relative flex items-center gap-6 group">
                    {/* Icon */}
                    <div className="relative flex items-center justify-center w-10 h-10 bg-white rounded-xl border border-gray-100 shadow-sm transition-all group-hover:scale-110 z-10 group-hover:shadow-lg group-hover:border-green-100">
                        {getIcon(act.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group-hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-black text-gray-900 tracking-tight uppercase">{act.title}</h4>
                            <span className="text-[10px] font-black text-green-500/60 uppercase tracking-widest bg-green-50 px-2.5 py-1 rounded-full border border-green-100/50">
                                {formatDistanceToNow(new Date(act.date), { addSuffix: true })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-3 bg-gray-200 rounded-full group-hover:bg-green-500 transition-colors"></div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Context ID: {act.id.slice(-8)}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityTimeline;

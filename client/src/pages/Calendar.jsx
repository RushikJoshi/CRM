import React, { useState, useEffect } from "react";
import { FiCalendar, FiClock, FiMapPin, FiPhone, FiVideo, FiCheckCircle } from "react-icons/fi";
import API from "../services/api";

const CalendarPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAllActivities = async () => {
        setLoading(true);
        try {
            const [calls, meetings, todos] = await Promise.all([
                API.get("/crm/calls"),
                API.get("/crm/meetings"),
                API.get("/crm/todos")
            ]);

            const normalizedCalls = (calls.data || []).map(c => ({
                id: c._id,
                title: c.title,
                type: 'call',
                time: c.startDate,
                description: c.description,
                status: c.status
            }));

            const normalizedMeetings = (meetings.data || []).map(m => ({
                id: m._id,
                title: m.title,
                type: 'meeting',
                time: m.startDate,
                endTime: m.endDate,
                description: m.description,
                location: m.location
            }));

            const normalizedTodos = (todos.data || []).map(t => ({
                id: t._id,
                title: t.title,
                type: 'task',
                time: t.dueDate,
                description: "Task Assignment",
                status: t.status
            }));

            setEvents([...normalizedCalls, ...normalizedMeetings, ...normalizedTodos]
                .filter(e => e.time)
                .sort((a, b) => new Date(a.time) - new Date(b.time)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllActivities();
    }, []);

    const formatDay = (dateStr) => {
        const date = new Date(dateStr);
        return {
            day: date.toLocaleDateString('en-US', { day: 'numeric' }),
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
        };
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Calendar</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">See all your calls, meetings, and tasks in one place.</p>
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                    <button className="px-5 py-2.5 bg-white text-green-600 font-black text-xs uppercase tracking-widest rounded-xl shadow-sm border border-gray-100">Upcoming</button>
                    <button className="px-5 py-2.5 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-gray-600 transition-colors">Past Activities</button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8 lg:p-12 relative">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

                <div className="space-y-10 max-w-4xl mx-auto relative z-10">
                    {events.map((event, i) => {
                        const dateInfo = formatDay(event.time);
                        const isCall = event.type === 'call';
                        const isTask = event.type === 'task';
                        const isMeeting = event.type === 'meeting';

                        // Theme colors for event types
                        const typeTheme = isCall ? {
                            border: 'border-l-green-500', bg: 'bg-green-50', text: 'text-green-500', icon: <FiPhone size={18} />, label: 'Call'
                        } : isTask ? {
                            border: 'border-l-green-500', bg: 'bg-green-50', text: 'text-green-600', icon: <FiCheckCircle size={18} />, label: 'Task'
                        } : {
                            border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <FiVideo size={18} />, label: 'Meeting'
                        };

                        return (
                            <div key={event.id} className="flex gap-8 lg:gap-12 items-start group">
                                <div className="flex flex-col items-center w-16 lg:w-20 pt-2 flex-shrink-0">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{dateInfo.month}</span>
                                    <span className="text-4xl font-black text-gray-900 tracking-tighter mb-1 select-none">{dateInfo.day}</span>
                                    <span className="text-[9px] font-black text-green-600/60 uppercase tracking-widest select-none">{dateInfo.weekday}</span>
                                </div>

                                <div className="flex-1 relative pb-10 lg:pb-12">
                                    {/* Timeline line */}
                                    {i !== events.length - 1 && <div className="absolute -left-[3rem] lg:-left-[4rem] top-12 bottom-0 w-[2px] bg-gradient-to-b from-gray-200 to-transparent shadow-[0_0_10px_rgba(0,0,0,0.05)]" />}

                                    <div className={`p-6 lg:p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 bg-white relative border-l-4 ${typeTheme.border}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 rounded-2xl shadow-inner ${typeTheme.bg} ${typeTheme.text}`}>
                                                    {typeTheme.icon}
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{typeTheme.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 border border-gray-100 w-fit">
                                                <FiClock size={12} className={typeTheme.text} /> {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {event.endTime && ` - ${new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight pr-8">{event.title}</h3>
                                        <p className="text-sm text-gray-500 font-medium mb-5 line-clamp-2 md:line-clamp-none">{event.description || "No details provided."}</p>

                                        {event.location && (
                                            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 pt-5 border-t border-gray-50">
                                                <FiMapPin size={14} className="text-gray-300" /> {event.location}
                                            </div>
                                        )}
                                        {event.status === 'Closed' && <div className="absolute top-6 right-6 text-green-500 bg-green-50 p-1 rounded-full"><FiCheckCircle size={20} /></div>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {events.length === 0 && !loading && (
                    <div className="py-32 text-center flex flex-col items-center justify-center relative z-10">
                        <div className="w-24 h-24 bg-gray-50 border border-gray-100 rounded-[2.5rem] flex items-center justify-center text-gray-300 text-4xl mb-6 shadow-inner"><FiCalendar /></div>
                        <p className="text-gray-400 font-black tracking-[0.2em] uppercase text-xs">No activities scheduled</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarPage;

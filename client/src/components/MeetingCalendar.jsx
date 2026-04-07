import React, { useState, useEffect, useRef } from "react";
import { 
    format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, 
    startOfDay, endOfDay, addMinutes, differenceInMinutes, 
    isSameDay, parseISO, isWithinInterval, startOfMonth, 
    endOfMonth, eachHourOfInterval, isToday, isPast, addMonths, subMonths
} from "date-fns";
import { 
    FiChevronLeft, FiChevronRight, FiClock, 
    FiVideo, FiMapPin, FiX, FiCheck, FiAlertCircle 
} from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const SLOT_HEIGHT = 60; // 1 hour = 60px
const START_HOUR = 8;
const END_HOUR = 21;
const HOURS = eachHourOfInterval({
    start: startOfDay(new Date()).setHours(START_HOUR),
    end: startOfDay(new Date()).setHours(END_HOUR)
});

const MeetingCalendar = () => {
    const toast = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState("day"); // 'day', 'week'
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [formData, setFormData] = useState({ title: "", description: "", channel: "online" });
    const [saving, setSaving] = useState(false);

    // Refs for drag and drop
    const dragRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedMeeting, setDraggedMeeting] = useState(null);
    const [dragOffset, setDragOffset] = useState(0);

    const currentUser = getCurrentUser();
    const roleBase = currentUser?.role === "super_admin"
        ? "/superadmin"
        : currentUser?.role === "branch_manager"
            ? "/branch"
            : currentUser?.role === "sales"
                ? "/sales"
                : "/company";

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const startStr = startOfWeek(currentDate, { weekStartsOn: 1 }).toISOString();
            const endStr = endOfWeek(currentDate, { weekStartsOn: 1 }).toISOString();
            const res = await API.get(`/crm/meetings?start=${startStr}&end=${endStr}`);
            setMeetings(res.data?.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, [currentDate]);

    const handleSlotClick = (date, hour) => {
        toast.info("Create new meetings from the Meetings module.");
    };

    const handleMeetingClick = (e, meeting) => {
        e.stopPropagation();
        setEditingMeeting(meeting);
        setFormData({
            title: meeting.title,
            description: meeting.description || "",
            channel: meeting.channel || "online"
        });
        setSelectedSlot({ 
            start: new Date(meeting.startDate), 
            end: new Date(meeting.endDate) 
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                startDate: selectedSlot.start.toISOString(),
                endDate: selectedSlot.end.toISOString(),
            };

            if (editingMeeting) {
                await API.put(`/crm/meetings/${editingMeeting._id}`, payload);
                toast.success("Meeting updated successfully");
            } else {
                await API.post("/crm/meetings", payload);
                toast.success("Meeting scheduled");
            }
            setShowModal(false);
            fetchMeetings();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failure in protocol");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingMeeting) return;
        if (window.confirm("Abort this meeting protocol?")) {
            try {
                await API.delete(`/crm/meetings/${editingMeeting._id}`);
                toast.success("Meeting terminated");
                setShowModal(false);
                fetchMeetings();
            } catch (err) {
                toast.error("Process failure");
            }
        }
    };

    const onDragStart = (e, meeting) => {
        setIsDragging(true);
        setDraggedMeeting(meeting);
        // Calculate offset from top of the meeting block
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset(e.clientY - rect.top);
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const onDrop = async (e, date) => {
        if (!draggedMeeting) return;
        
        const gridRect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - gridRect.top;
        const minutes = Math.floor(y / (SLOT_HEIGHT / 60) / 15) * 15; // Snap to 15 min
        
        const newStart = new Date(date);
        newStart.setHours(START_HOUR, minutes, 0, 0);
        
        const duration = differenceInMinutes(new Date(draggedMeeting.endDate), new Date(draggedMeeting.startDate));
        const newEnd = addMinutes(newStart, duration);

        setIsDragging(false);
        setDraggedMeeting(null);

        try {
            await API.put(`/crm/meetings/${draggedMeeting._id}`, {
                startDate: newStart.toISOString(),
                endDate: newEnd.toISOString()
            });
            fetchMeetings();
            toast.success("Time vector updated");
        } catch (err) {
            toast.error(err.response?.data?.message || "Collision detected");
        }
    };

    const renderGrid = (date) => {
        const dayMeetings = meetings.filter(m => isSameDay(parseISO(m.startDate), date));

        return (
            <div 
                className="relative flex-1 bg-white border-r border-gray-100 min-h-[800px]"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, date)}
            >
                {/* Time Slots */}
                {HOURS.map((hour, idx) => (
                    <div 
                        key={idx}
                        className="h-[60px] border-b border-gray-50 hover:bg-cyan-50/20 transition-colors cursor-crosshair"
                        onClick={() => handleSlotClick(date, hour.getHours())}
                    />
                ))}

                {/* Background Busy Slots */}
                {dayMeetings.map(m => {
                    const start = parseISO(m.startDate);
                    const end = parseISO(m.endDate);
                    const top = (differenceInMinutes(start, startOfDay(start).setHours(START_HOUR)) / 60) * SLOT_HEIGHT;
                    const height = (differenceInMinutes(end, start) / 60) * SLOT_HEIGHT;
                    return (
                        <div 
                            key={`busy-${m._id}`}
                            className="absolute left-0 right-0 bg-slate-100/30 pointer-events-none border-y border-slate-200/20"
                            style={{ top: `${top}px`, height: `${height}px` }}
                        />
                    );
                })}

                {/* Current Time Indicator */}
                {isToday(date) && (
                    <div 
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{ 
                            top: `${(differenceInMinutes(new Date(), startOfDay(new Date()).setHours(START_HOUR)) / 60) * SLOT_HEIGHT}px` 
                        }}
                    >
                        <div className="w-full h-[2px] bg-rose-500 relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-rose-500 rounded-full -ml-1.5 shadow-sm" />
                        </div>
                    </div>
                )}

                {/* Meetings */}
                <AnimatePresence>
                    {dayMeetings.map(meeting => {
                        const start = parseISO(meeting.startDate);
                        const end = parseISO(meeting.endDate);
                        const top = (differenceInMinutes(start, startOfDay(start).setHours(START_HOUR)) / 60) * SLOT_HEIGHT;
                        const height = (differenceInMinutes(end, start) / 60) * SLOT_HEIGHT;

                        return (
                            <motion.div
                                key={meeting._id}
                                layoutId={meeting._id}
                                draggable
                                onDragStart={(e) => onDragStart(e, meeting)}
                                onClick={(e) => handleMeetingClick(e, meeting)}
                                className={`absolute left-1 right-1 z-10 rounded-xl p-3 border-l-4 shadow-sm cursor-move overflow-hidden transition-shadow hover:shadow-md ${
                                    meeting.status === 'Completed' 
                                    ? 'bg-emerald-50/80 border-l-emerald-500 text-emerald-800' 
                                    : 'bg-cyan-50/80 border-l-cyan-500 text-cyan-800'
                                }`}
                                style={{ top, height: `${height}px` }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <div className="font-black text-[11px] truncate uppercase tracking-tighter">{meeting.title}</div>
                                <div className="flex items-center gap-1 mt-1 text-[9px] font-bold opacity-70">
                                    <FiClock size={10} /> 
                                    {format(start, "HH:mm")} - {format(end, "HH:mm")}
                                </div>

                                {/* Resize Handle */}
                                <div 
                                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-black/5"
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        const onMouseMove = (moveEvent) => {
                                            const deltaY = moveEvent.clientY - e.clientY;
                                            const snapY = Math.round(deltaY / 15) * 15; // 15 min snaps
                                            if (snapY !== 0) {
                                                // Handle resize logic here if we had state-based optimistic updates
                                                // For now, we'll just handle the drop
                                            }
                                        };
                                        const onMouseUp = async (upEvent) => {
                                            const deltaY = upEvent.clientY - e.clientY;
                                            const addedMinutes = Math.round((deltaY / SLOT_HEIGHT) * 60 / 15) * 15;
                                            if (addedMinutes !== 0) {
                                                const newEnd = addMinutes(end, addedMinutes);
                                                try {
                                                    await API.put(`/crm/meetings/${meeting._id}`, { endDate: newEnd.toISOString() });
                                                    fetchMeetings();
                                                    toast.success("Duration updated");
                                                } catch (err) {
                                                    toast.error("Collision detected");
                                                }
                                            }
                                            window.removeEventListener('mousemove', onMouseMove);
                                            window.removeEventListener('mouseup', onMouseUp);
                                        };
                                        window.addEventListener('mousemove', onMouseMove);
                                        window.addEventListener('mouseup', onMouseUp);
                                    }}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        );
    };

    const weekDays = eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 })
    });

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen animate-in fade-in duration-500">
            {/* Left Panel */}
            <div className="w-80 bg-white border-r border-slate-200 p-6 space-y-8 shrink-0 hidden lg:block">
                <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-5 space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Meetings Module</p>
                    <h3 className="text-lg font-black text-slate-900">Use the dedicated meeting composer</h3>
                    <p className="text-sm font-medium text-slate-500">
                        Calendar is view-only for new meeting creation now. Open the meetings module to create online or offline meetings with reminders and sharing.
                    </p>
                    <button
                        onClick={() => window.location.assign(`${roleBase}/meetings`)}
                        className="w-full py-3 bg-cyan-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-cyan-600/20 hover:bg-cyan-700 transition-all"
                    >
                        Open Meetings
                    </button>
                </div>

                {/* Mini Calendar (Simplified) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">{format(currentDate, "MMMM yyyy")}</h3>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><FiChevronLeft /></button>
                            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><FiChevronRight /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 text-center gap-y-2">
                        {['m', 't', 'w', 't', 'f', 's', 's'].map((d, i) => <div key={`${d}-${i}`} className="text-[9px] font-black text-slate-400 uppercase">{d}</div>)}
                        {Array.from({ length: 35 }).map((_, i) => {
                            const day = addDays(startOfMonth(currentDate), i - startOfMonth(currentDate).getDay() + 1);
                            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                            const isSelected = isSameDay(day, currentDate);
                            return (
                                <button 
                                    key={i} 
                                    onClick={() => setCurrentDate(day)}
                                    className={`w-8 h-8 rounded-xl text-[10px] font-bold flex items-center justify-center transition-all ${
                                        isSelected ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 
                                        isCurrentMonth ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-300'
                                    }`}
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Availability status</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                            <div className="w-2.5 h-2.5 rounded-sm bg-cyan-100 border border-cyan-500" /> Confirmed
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-500" /> Completed
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                            <div className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-300" /> Busy Slot
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Calendar Panel */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95">Today</button>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentDate(addDays(currentDate, view === 'week' ? -7 : -1))} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"><FiChevronLeft size={20} /></button>
                            <button onClick={() => setCurrentDate(addDays(currentDate, view === 'week' ? 7 : 1))} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"><FiChevronRight size={20} /></button>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">{format(currentDate, "MMMM d, yyyy")}</h2>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                        {['day', 'week'].map(v => (
                            <button 
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    view === v ? 'bg-white text-cyan-700 shadow-sm border border-slate-200/50' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex-1 overflow-auto bg-white custom-scrollbar">
                    <div className="flex min-w-[800px]">
                        {/* Time Column */}
                        <div className="w-20 shrink-0 bg-slate-50/50 border-r border-slate-200 flex flex-col pt-[60px]">
                            {HOURS.map((hour, idx) => (
                                <div key={idx} className="h-[60px] pr-3 -mt-2.5 flex items-start justify-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{format(hour, "ha")}</span>
                                </div>
                            ))}
                        </div>

                        {/* Grid Days */}
                        {view === 'day' ? (
                            <div className="flex-1 flex flex-col">
                                <div className="h-[60px] border-b border-slate-200 flex items-center px-6 bg-white sticky top-0 z-20">
                                    <h3 className={`text-sm font-black uppercase tracking-widest ${isToday(currentDate) ? 'text-cyan-600' : 'text-slate-400'}`}>
                                        {format(currentDate, "EEEE")}
                                    </h3>
                                </div>
                                {renderGrid(currentDate)}
                            </div>
                        ) : (
                            weekDays.map(day => (
                                <div key={day.toString()} className="flex-1 flex flex-col border-r border-slate-100 last:border-r-0">
                                    <div className="h-[60px] border-b border-slate-200 flex flex-col items-center justify-center bg-white sticky top-0 z-20">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{format(day, "EEE")}</div>
                                        <div className={`text-lg font-black leading-none mt-0.5 ${isToday(day) ? 'w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center' : 'text-slate-700'}`}>
                                            {format(day, "d")}
                                        </div>
                                    </div>
                                    {renderGrid(day)}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200"
                    >
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingMeeting ? "Refine Session" : "Schedule Intake"}</h3>
                                <p className="text-[9px] font-black text-cyan-600 uppercase tracking-widest mt-1">Operational Protocol v2.0</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"><FiX size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FiClock size={10} className="text-cyan-500" /> Start Protocol
                                    </label>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full bg-transparent border-none outline-none text-[12px] font-bold text-slate-700 p-0 focus:ring-0"
                                        value={format(selectedSlot.start, "yyyy-MM-dd'T'HH:mm")}
                                        onChange={(e) => setSelectedSlot({ ...selectedSlot, start: new Date(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FiClock size={10} className="text-rose-500" /> End Protocol
                                    </label>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full bg-transparent border-none outline-none text-[12px] font-bold text-slate-700 p-0 focus:ring-0"
                                        value={format(selectedSlot.end, "yyyy-MM-dd'T'HH:mm")}
                                        onChange={(e) => setSelectedSlot({ ...selectedSlot, end: new Date(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Session Identity</label>
                                <input 
                                    required 
                                    className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-cyan-600/10 focus:border-cyan-400 focus:bg-white transition-all font-bold text-slate-700 text-sm shadow-inner" 
                                    placeholder="Brief title..." 
                                    value={formData.title} 
                                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Intelligence Context</label>
                                <textarea 
                                    rows={3}
                                    className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-cyan-600/10 focus:border-cyan-400 focus:bg-white transition-all font-bold text-slate-700 text-sm shadow-inner resize-none" 
                                    placeholder="Meeting objectives..." 
                                    value={formData.description} 
                                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                {['online', 'phone', 'in_person'].map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, channel: c })}
                                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                            formData.channel === c ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/20' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                                        }`}
                                    >
                                        {c.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-4">
                                {editingMeeting && (
                                    <button 
                                        type="button" 
                                        onClick={handleDelete}
                                        className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all"
                                    >
                                        <FiX size={20} />
                                    </button>
                                )}
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="flex-1 py-4 bg-cyan-600 text-white font-black rounded-2xl shadow-xl shadow-cyan-600/20 hover:bg-cyan-700 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em] disabled:opacity-70"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                    ) : (
                                        editingMeeting ? "Update Broadcast" : "Confirm Sync"
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default MeetingCalendar;

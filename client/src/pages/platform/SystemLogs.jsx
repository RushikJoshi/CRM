import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { FiClock, FiMapPin, FiUser, FiBriefcase, FiRefreshCw, FiCalendar } from "react-icons/fi";

export default function SystemLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/super-admin/system-logs?page=${page}&limit=50`);
            if (res.data.success) {
                setLogs(res.data.data);
                setTotalPages(res.data.totalPages);
            }
        } catch (error) {
            console.error("Error fetching system logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[28px] font-black text-[#0F172A] tracking-tight">System Logs</h1>
                    <p className="text-slate-500 text-sm font-medium">Real-time platform access and authentication audit.</p>
                </div>
                <button 
                    onClick={fetchLogs}
                    className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-[#0F172A] font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Company</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">User</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Location / IP</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                            <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Loading Logs...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">
                                        No system logs found
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#0F172A]">
                                                    <FiClock className="text-indigo-500" size={12} />
                                                    {formatTime(log.createdAt)}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                                    <FiCalendar size={10} />
                                                    {formatDate(log.createdAt)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                                                    {log.companyId?.name?.[0] || <FiBriefcase />}
                                                </div>
                                                <span className="text-[13px] font-bold text-[#0F172A]">
                                                    {log.companyId?.name || "System"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-[#0F172A]">{log.userId?.name || "Unknown"}</span>
                                                <span className="text-[11px] font-medium text-slate-400">{log.userId?.email || "N/A"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[13px] font-bold text-[#0F172A]">
                                            <div className="flex items-center gap-2">
                                                <FiMapPin className="text-rose-500" size={14} />
                                                <div className="flex flex-col">
                                                    <span>{log.ipAddress}</span>
                                                    <span className="text-[10px] font-medium text-slate-400 tracking-tight leading-none uppercase">{log.location}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                log.status === "success" 
                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                                : "bg-rose-50 text-rose-600 border border-rose-100"
                                            }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                            >
                                Prev
                            </button>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

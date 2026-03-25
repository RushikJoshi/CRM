import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { FiClock, FiMapPin, FiUser, FiBriefcase, FiRefreshCw, FiCalendar, FiSmartphone } from "react-icons/fi";

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
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="animate-fade-in space-y-6 pb-10">
            <div className="flex items-center justify-between mt-2">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 poppins">System Logs</h1>
                    <p className="text-[13px] text-slate-500 mt-0.5">Audit log for platform authentication and access activity.</p>
                </div>
                <button 
                    onClick={fetchLogs}
                    className="btn-saas-secondary h-9 px-4"
                >
                    <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} /> 
                    <span className="ml-2">Sync Logs</span>
                </button>
            </div>

            <div className="saas-table-container">
                <table className="saas-table">
                    <thead>
                        <tr>
                            <th className="saas-th">Timestamp</th>
                            <th className="saas-th">Organization</th>
                            <th className="saas-th">User Profile</th>
                            <th className="saas-th">Network / Location</th>
                            <th className="saas-th text-right">Access</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && logs.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-slate-400 text-[11px] font-medium uppercase tracking-widest">Hydrating Logs...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center text-slate-400 text-sm font-medium">
                                    No transaction logs detected in the system.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log._id} className="saas-tr group">
                                    <td className="saas-td">
                                        <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                                            <FiClock className="text-slate-300" size={13} />
                                            {formatTime(log.createdAt)}
                                        </div>
                                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                            {formatDate(log.createdAt)}
                                        </div>
                                    </td>
                                    <td className="saas-td">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-[10px] uppercase font-bold">
                                                {log.companyId?.name?.[0] || <FiBriefcase size={10} />}
                                            </div>
                                            <span className="text-[13px] font-semibold text-slate-700">
                                                {log.companyId?.name || "Infrastructure"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="saas-td">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded border border-indigo-100 bg-indigo-50/50 flex items-center justify-center text-indigo-600">
                                                <FiUser size={13} />
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-semibold text-slate-800 leading-none">{log.userId?.name || "Internal System"}</div>
                                                <div className="text-[11px] text-slate-400 mt-1">{log.userId?.email || "api-access"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="saas-td">
                                        <div className="flex items-center gap-2">
                                            <FiSmartphone className="text-slate-300" size={13} />
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-mono text-slate-600">{log.ipAddress}</span>
                                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">{log.location || "Cluster Internal"}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="saas-td text-right">
                                        <span className={`badge-saas uppercase text-[9px] ${
                                            log.status === "success" 
                                            ? "bg-emerald-50 text-emerald-600" 
                                            : "bg-rose-50 text-rose-600"
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Page {page} of {totalPages}</span>
                        <div className="flex gap-1.5">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn-saas-secondary h-8 px-3 text-[11px]"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="btn-saas-secondary h-8 px-3 text-[11px]"
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

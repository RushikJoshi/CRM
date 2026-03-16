import React, { createContext, useContext, useState, useCallback } from "react";
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const ICONS = {
    success: <FiCheckCircle size={18} />,
    error: <FiXCircle size={18} />,
    warning: <FiAlertTriangle size={18} />,
    info: <FiInfo size={18} />,
};

const COLORS = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
};

const ICON_COLORS = {
    success: "text-green-500",
    error: "text-red-500",
    warning: "text-amber-500",
    info: "text-blue-500",
};

let _id = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = "info", duration = 4000) => {
        const id = ++_id;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Convenience methods
    toast.success = (msg, dur) => toast(msg, "success", dur);
    toast.error = (msg, dur) => toast(msg, "error", dur);
    toast.warning = (msg, dur) => toast(msg, "warning", dur);
    toast.info = (msg, dur) => toast(msg, "info", dur);

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {/* Toast container — fixed top-right */}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl backdrop-blur-sm
              pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-300
              ${COLORS[t.type]}`}
                    >
                        <span className={`mt-0.5 shrink-0 ${ICON_COLORS[t.type]}`}>
                            {ICONS[t.type]}
                        </span>
                        <p className="text-sm font-bold flex-1 leading-snug">{t.message}</p>
                        <button
                            onClick={() => dismiss(t.id)}
                            className="shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity"
                        >
                            <FiX size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

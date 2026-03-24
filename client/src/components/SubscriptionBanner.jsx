import React from "react";
import { FiAlertCircle, FiClock, FiCreditCard } from "react-icons/fi";
import { readSession, getSessionKeyForPath } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const SubscriptionBanner = () => {
    const { pathname } = useLocation();
    const key = getSessionKeyForPath(pathname);
    const session = readSession(key);
    const user = session?.user;

    if (!user || user.role === "super_admin" || !user.subscription) return null;

    const endDate = user.subscription.endDate;
    if (!endDate) return null;

    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Show warning if 2 days or 1 day left
    if (diffDays > 2 || diffDays < 0) return null;

    return (
        <div className="bg-[#FFFBEB] border-b border-[#FEF3C7] px-6 py-3 flex items-center justify-between sticky top-0 z-[40] animate-in slide-in-from-top duration-500 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 border border-amber-200 shadow-sm grow-0">
                    <FiClock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex flex-col">
                    <p className="text-[#92400E] font-black uppercase tracking-widest text-[10px]">Plan Expiring Soon</p>
                    <p className="text-[#B45309] text-sm font-bold tracking-tight">
                        Your subscription will expire in {diffDays === 1 ? "1 day (Tomorrow)" : `${diffDays} days`}.
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <p className="hidden md:block text-[#B45309] text-xs font-bold bg-[#FEF3C7] px-3 py-1.5 rounded-lg border border-[#FDE68A]">
                    Expires: {new Date(endDate).toLocaleDateString()}
                </p>
                <a 
                    href="mailto:support@edupathpro.com"
                    className="h-10 px-6 bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 flex items-center gap-2 active:scale-95"
                >
                    <FiCreditCard size={14} /> Renew Now
                </a>
            </div>
        </div>
    );
};

export default SubscriptionBanner;

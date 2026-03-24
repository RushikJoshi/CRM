import React from "react";
import { FiAlertTriangle, FiPhoneCall, FiLogOut } from "react-icons/fi";

const SubscriptionExpired = () => {
  const handleLogout = () => {
    // Clear all sessions and redirect
    const roles = ["super_admin", "company_admin", "branch_manager", "sales", "support", "marketing"];
    roles.forEach(role => localStorage.removeItem(`session_${role}`));
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-primary">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-10 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
          <FiAlertTriangle className="text-rose-500 w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-black text-[#0F172A] mb-4 tracking-tight leading-tight">
          Plan Expired
        </h1>
        
        <p className="text-slate-500 text-base leading-relaxed mb-10 px-2 font-medium">
          Your company subscription has expired. Please contact your administrator to renew your plan and resume access to the CRM.
        </p>

        <div className="space-y-4">
          <a 
            href="mailto:support@edupathpro.com" 
            className="w-full h-14 bg-[#0F172A] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#1E293B] transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
          >
            <FiPhoneCall /> Contact Admin
          </a>
          
          <button 
            onClick={handleLogout}
            className="w-full h-14 bg-white text-[#64748B] border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
          >
            <FiLogOut /> Logout and Login Again
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-300">EduPathpro Platform</span>
            <div className="flex gap-4">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-100"></span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;

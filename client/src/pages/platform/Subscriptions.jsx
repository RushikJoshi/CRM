import React, { useState, useEffect } from "react";
import { FiSearch, FiRefreshCcw, FiCalendar, FiCreditCard, FiCheckCircle, FiAlertCircle, FiX, FiPlus, FiChevronLeft, FiPlusCircle } from "react-icons/fi";
import API from "../../services/api";
import { useToast } from "../../context/ToastContext";

const SubscriptionForm = ({ company, plans, companies, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    companyId: "",
    planId: "",
    startDate: new Date().toISOString().split("T")[0],
    customEndDate: ""
  });

  useEffect(() => {
    if (company) {
      setFormData(prev => ({
        ...prev,
        companyId: company._id,
        planId: company.planId?._id || company.planId || ""
      }));
    }
  }, [company]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={onCancel}
          className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all shadow-sm group"
        >
          <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
           <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">Assign Subscription</h2>
           <p className="text-slate-400 font-medium text-sm">Update or activate a new plan for a company.</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 p-12">
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Company Selection */}
             <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 pl-1">Target Company</label>
               {company ? (
                 <div className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 flex items-center text-sm font-black text-[#0F172A] shadow-inner">
                    {company.name}
                 </div>
               ) : (
                 <select 
                    required
                    className="w-full h-16 bg-[#F8FAFC] border border-slate-100 rounded-2xl px-6 text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner appearance-none cursor-pointer"
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                 >
                    <option value="">Select a company</option>
                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                 </select>
               )}
             </div>

             {/* Plan Selection */}
             <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 pl-1">Choose Plan</label>
               <select 
                 required
                 className="w-full h-16 bg-[#F8FAFC] border border-slate-100 rounded-2xl px-6 text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner appearance-none cursor-pointer"
                 value={formData.planId}
                 onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
               >
                 <option value="">Select a tier</option>
                 {plans.map(p => <option key={p._id} value={p._id}>{p.name} (₹{p.price} / {p.duration} days)</option>)}
               </select>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Start Date */}
             <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 pl-1">Effective Date</label>
               <input 
                 type="date"
                 required
                 className="w-full h-16 bg-[#F8FAFC] border border-slate-100 rounded-2xl px-6 text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner"
                 value={formData.startDate}
                 onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
               />
             </div>

             {/* End Date Override */}
             <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 pl-1">Custom Expiry (Optional)</label>
               <input 
                 type="date"
                 className="w-full h-16 bg-[#F8FAFC] border border-slate-100 rounded-2xl px-6 text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner"
                 value={formData.customEndDate}
                 onChange={(e) => setFormData({ ...formData, customEndDate: e.target.value })}
               />
               <p className="text-[10px] text-slate-400 font-bold pl-2 italic tracking-tight">Leave blank to use the plan's default duration.</p>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pt-6 pt-10 border-t border-slate-50">
            <button className="flex-1 h-16 bg-[#0F172A] text-white rounded-[1.5rem] font-bold hover:bg-[#1E293B] transition-all active:scale-[0.98] shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-3">
               <FiPlusCircle size={20} /> Activate Subscription Now
            </button>
            <button 
              type="button" 
              onClick={onCancel}
              className="sm:w-40 h-16 bg-white border border-slate-200 text-slate-500 rounded-[1.5rem] font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              Back to List
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Subscriptions() {
  const [view, setView] = useState("list"); // "list" or "form"
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const toast = useToast();

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [compRes, planRes] = await Promise.all([
        API.get(`/super-admin/companies?search=${search}&limit=100`),
        API.get("/super-admin/plans")
      ]);
      setCompanies(compRes.data.data);
      setPlans(planRes.data.data);
    } catch (err) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [search]);

  const handleAssign = async (data) => {
    try {
      await API.post("/super-admin/companies/assign-plan", {
        companyId: selectedCompany?._id || data.companyId,
        ...data
      });
      toast.success("Subscription updated successfully");
      setView("list");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  const getStatusColor = (company) => {
    const now = new Date();
    if (company.endDate && new Date(company.endDate) < now) return "bg-rose-50 text-rose-600 border-rose-100";
    if (company.subscriptionStatus === "expired") return "bg-rose-50 text-rose-600 border-rose-100";
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
  };

  if (view === "form") {
    return (
      <div className="p-8 font-primary">
         <SubscriptionForm 
            company={selectedCompany} 
            plans={plans} 
            companies={companies} 
            onSave={handleAssign} 
            onCancel={() => setView("list")} 
         />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700 font-primary pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/60">
        <div>
          <h1 className="text-4xl font-black text-[#04040a] mb-2 tracking-tight">System Subscriptions</h1>
          <p className="text-slate-500 font-medium text-lg tracking-tight">Manage renewals and new plan activations for all tenants.</p>
        </div>
        <button 
          onClick={() => { setSelectedCompany(null); setView("form"); }}
          className="h-16 px-10 bg-[#0F172A] text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-3 hover:bg-[#1E293B] transition-all shadow-xl shadow-slate-200 active:scale-95 text-xs uppercase tracking-widest whitespace-nowrap"
        >
          <FiPlusCircle className="w-6 h-6" /> Manual Assign
        </button>
      </div>

      <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-lg group">
            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <input 
               placeholder="Find company to manage..."
               className="w-full h-16 bg-[#F8FAFC] border border-slate-50 rounded-[1.5rem] pl-16 pr-4 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all shadow-inner"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={fetchAll} className="w-16 h-16 bg-slate-50 border border-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-all active:rotate-180 duration-500 shrink-0">
              <FiRefreshCcw size={20} />
          </button>
      </div>

      {loading ? (
          <div className="h-[400px] flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-slate-50 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
          </div>
      ) : (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-100/40 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="border-b border-slate-50 bg-[#F8FAFC]/55">
                            <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Company</th>
                            <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Current Tier</th>
                            <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Start Date</th>
                            <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Expiry</th>
                            <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400 text-center">Status</th>
                            <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {companies.map(comp => {
                            const plan = plans.find(p => p._id === (comp.planId?._id || comp.planId));
                            const isExpired = (comp.endDate && new Date(comp.endDate) < new Date()) || comp.subscriptionStatus === "expired";
                            
                            return (
                                <tr key={comp._id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <span className="text-[15px] font-black text-[#0F172A] mb-0.5">{comp.name}</span>
                                            <span className="text-[12px] text-slate-400 font-bold opacity-70 tracking-tight">{comp.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                                <FiCreditCard size={15} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-[#475569]">{plan?.name || "No Plan"}</span>
                                                <span className="text-[11px] font-bold text-slate-400 tracking-tight italic">₹{plan?.price || 0} base</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-2 text-[#64748B] font-bold text-sm">
                                            <FiCalendar size={14} className="text-slate-300" />
                                            {comp.startDate ? new Date(comp.startDate).toLocaleDateString() : "—"}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className={`flex items-center gap-2 font-black text-[15px] ${isExpired ? 'text-rose-500' : 'text-[#0F172A]'}`}>
                                            <FiCalendar size={14} className={isExpired ? 'text-rose-300' : 'text-slate-300'} />
                                            {comp.endDate ? new Date(comp.endDate).toLocaleDateString() : "—"}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(comp)}`}>
                                            {isExpired ? "Suspended" : "Active"}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button 
                                            onClick={() => { setSelectedCompany(comp); setView("form"); }}
                                            className="h-12 px-8 bg-white border border-slate-200 text-[#0F172A] rounded-2xl font-black text-[11px] uppercase tracking-[1px] hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95 flex items-center gap-2 ml-auto"
                                        >
                                            <FiRefreshCcw size={13} /> {isExpired ? "Re-Activate" : "Update"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>
          </div>
      )}
    </div>
  );
}

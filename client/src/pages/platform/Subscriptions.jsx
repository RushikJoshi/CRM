import React, { useState, useEffect } from "react";
import { FiSearch, FiRefreshCcw, FiCalendar, FiCreditCard, FiCheckCircle, FiAlertCircle, FiX, FiPlus, FiChevronLeft, FiPlusCircle, FiArrowLeft, FiCopy } from "react-icons/fi";

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
    <div className="animate-fade-in max-w-4xl mx-auto py-4">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onCancel}
          className="btn-saas-secondary w-10 h-10 p-0"
        >
          <FiArrowLeft size={18} />
        </button>
        <div>
           <h2 className="text-[20px] font-semibold text-slate-900 poppins">Assign Subscription</h2>
           <p className="text-slate-500 text-sm">Configure or update a company subscription plan.</p>
        </div>
      </div>

      <div className="saas-card p-8">
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-1.5">
               <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Company</label>
               {company ? (
                 <div className="w-full h-11 bg-slate-50 border border-slate-200 rounded-md px-4 flex items-center text-sm font-semibold text-slate-900 overflow-hidden truncate">
                    {company.name} <span className="text-slate-400 font-medium text-xs ml-2 italic">({company.customId || company._id})</span>
                 </div>

               ) : (
                 <select 
                    required
                    className="w-full h-11 bg-white border border-slate-200 rounded-md px-3 text-sm focus:border-indigo-500 transition-all outline-none"
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                 >
                    <option value="">Select a company</option>
                    {companies.map(c => <option key={c._id} value={c._id}>{c.name} ({c.customId || c._id})</option>)}

                 </select>
               )}
             </div>

             <div className="space-y-1.5">
               <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Plan / Tier</label>
               <select 
                 required
                 className="w-full h-11 bg-white border border-slate-200 rounded-md px-3 text-sm focus:border-indigo-500 transition-all outline-none"
                 value={formData.planId}
                 onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
               >
                 <option value="">Select a plan</option>
                 {plans.map(p => <option key={p._id} value={p._id}>{p.name} (₹{p.price} / {p.duration} days)</option>)}
               </select>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-1.5">
               <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
               <input 
                 type="date"
                 required
                 className="w-full h-11 bg-white border border-slate-200 rounded-md px-3 text-sm focus:border-indigo-500 transition-all outline-none"
                 value={formData.startDate}
                 onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
               />
             </div>

             <div className="space-y-1.5">
               <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Custom Expiry (Optional)</label>
               <input 
                 type="date"
                 className="w-full h-11 bg-white border border-slate-200 rounded-md px-3 text-sm focus:border-indigo-500 transition-all outline-none"
                 value={formData.customEndDate}
                 onChange={(e) => setFormData({ ...formData, customEndDate: e.target.value })}
               />
               <p className="text-[11px] text-slate-400 font-medium">Leave blank to use default plan duration.</p>
             </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button className="btn-saas-primary px-8 h-11">
               Activate Subscription
            </button>
            <button 
              type="button" 
              onClick={onCancel}
              className="btn-saas-secondary px-8 h-11"
            >
              Cancel
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

  const getStatusBadge = (company) => {
    const now = new Date();
    const isExpired = (company.endDate && new Date(company.endDate) < now) || company.subscriptionStatus === "expired";
    
    if (isExpired) {
        return <span className="badge-saas bg-rose-50 text-rose-600 border border-rose-100 uppercase text-[10px] tracking-wider">Expired</span>;
    }
    return <span className="badge-saas bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase text-[10px] tracking-wider">Active</span>;
  };

  if (view === "form") {
    return (
      <SubscriptionForm 
        company={selectedCompany} 
        plans={plans} 
        companies={companies} 
        onSave={handleAssign} 
        onCancel={() => setView("list")} 
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 poppins">System Subscriptions</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Manage plan assignments and renewals for platform tenants.</p>
        </div>
        <button 
          onClick={() => { setSelectedCompany(null); setView("form"); }}
          className="btn-saas-primary h-9 px-5"
        >
          <FiPlus size={16} /> Manual Assign
        </button>
      </div>

      <div className="flex items-center gap-3">
          <div className="relative group w-full max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
               placeholder="Search by company name..."
               className="w-full h-10 bg-white border border-slate-200 rounded-md pl-9 pr-4 text-sm focus:border-indigo-500 transition-all outline-none"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={fetchAll} className="btn-saas-secondary h-10 w-10 p-0">
              <FiRefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          </button>
      </div>

      {loading ? (
          <div className="h-[400px] saas-table-container flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-[12px] font-medium">Loading subscription data...</p>
          </div>
      ) : (
          <div className="saas-table-container">
            <table className="saas-table">
                <thead>
                    <tr>
                        <th className="saas-th">Company</th>
                        <th className="saas-th">Plan Tier</th>
                        <th className="saas-th">Dates</th>
                        <th className="saas-th">Status</th>
                        <th className="saas-th text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {companies.map(comp => {
                        const plan = plans.find(p => p._id === (comp.planId?._id || comp.planId));
                        const isExpired = (comp.endDate && new Date(comp.endDate) < new Date()) || comp.subscriptionStatus === "expired";
                        
                        return (
                            <tr key={comp._id} className="saas-tr group">
                                <td className="saas-td">
                                    <div className="font-semibold text-slate-900 truncate max-w-[200px]">{comp.name}</div>
                                    <div className="text-[11px] text-slate-400 uppercase tracking-tight">ID: {comp.customId || comp._id}</div>

                                </td>
                                <td className="saas-td">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <FiCreditCard size={12} />
                                        </div>
                                        <div>
                                          <div className="font-semibold text-slate-700 text-[13px]">{plan?.name || "No Plan"}</div>
                                          <div className="text-[11px] text-slate-400">₹{plan?.price || 0}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="saas-td">
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                          <FiCalendar size={12} className="text-slate-300" />
                                          <span>{comp.startDate ? new Date(comp.startDate).toLocaleDateString() : "—"}</span>
                                      </div>
                                      <div className={`flex items-center gap-1.5 text-[12px] font-semibold ${isExpired ? 'text-rose-500' : 'text-slate-400'}`}>
                                          <FiCalendar size={12} className="opacity-70" />
                                          <span>Expiry: {comp.endDate ? new Date(comp.endDate).toLocaleDateString() : "—"}</span>
                                      </div>
                                    </div>
                                </td>
                                <td className="saas-td italic font-bold">
                                    {getStatusBadge(comp)}
                                </td>
                                <td className="saas-td text-right">
                                    <button 
                                        onClick={() => { setSelectedCompany(comp); setView("form"); }}
                                        className="btn-saas-secondary h-8 px-4 text-[12px] font-semibold flex items-center gap-2 ml-auto"
                                    >
                                        <FiRefreshCcw size={12} /> {isExpired ? "Re-Activate" : "Update"}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
      )}
    </div>
  );
}

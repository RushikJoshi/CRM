import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiCheckCircle, FiChevronLeft } from "react-icons/fi";
import API from "../../services/api";
import { useToast } from "../../context/ToastContext";

const PlanForm = ({ plan, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    duration: 30,
    price: 0,
    features: "",
    isActive: true
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        ...plan,
        features: plan.features?.join(", ") || ""
      });
    }
  }, [plan]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      features: formData.features.split(",").map(f => f.trim()).filter(Boolean)
    };
    onSave(finalData);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onCancel}
          className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all shadow-sm group"
        >
          <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
           <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">{plan ? "Edit Plan" : "Create New Plan"}</h2>
           <p className="text-slate-400 font-medium text-sm">Fill in the details below to {plan ? "update" : "setup"} a subscription tier.</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 p-10 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 pl-1">Plan Name</label>
            <input 
              required
              className="w-full h-14 bg-[#F8FAFC] border border-slate-100 rounded-2xl px-6 text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner"
              placeholder="e.g. Professional"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 pl-1">Duration (Days)</label>
              <input 
                type="number"
                required
                className="w-full h-14 bg-[#F8FAFC] border border-slate-100 rounded-2xl px-6 text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner"
                placeholder="30"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 pl-1">Price (₹)</label>
              <input 
                type="number"
                required
                className="w-full h-14 bg-[#F8FAFC] border border-slate-100 rounded-2xl px-6 text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner"
                placeholder="2000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 pl-1">Features (Comma separated)</label>
            <textarea 
              className="w-full h-40 bg-[#F8FAFC] border border-slate-100 rounded-[2rem] p-6 text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner resize-none leading-relaxed"
              placeholder="Unlimited users, Advanced reports, Priority support..."
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <input 
              type="checkbox"
              id="isActive"
              className="w-6 h-6 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer transition-all"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-sm font-black text-[#334155] cursor-pointer select-none">Make this plan active and visible</label>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit"
              className="flex-1 h-16 bg-[#0F172A] text-white rounded-2xl font-bold hover:bg-[#1E293B] transition-all active:scale-[0.98] shadow-xl shadow-slate-200/60 flex items-center justify-center gap-2"
            >
              <FiCheckCircle size={18} /> {plan ? "Save Updates" : "Create Plan Now"}
            </button>
            <button 
              type="button"
              onClick={onCancel}
              className="sm:w-32 h-16 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Plans() {
  const [view, setView] = useState("list"); // "list" or "form"
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const toast = useToast();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await API.get("/super-admin/plans");
      setPlans(res.data.data);
    } catch (err) {
      toast.error("Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async (data) => {
    try {
      if (currentPlan) {
        await API.put(`/super-admin/plans/${currentPlan._id}`, data);
        toast.success("Plan updated successfully");
      } else {
        await API.post("/super-admin/plans", data);
        toast.success("Plan created successfully");
      }
      setView("list");
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
      if (!window.confirm("Are you sure? This will delete the plan permanently.")) return;
      try {
          await API.delete(`/super-admin/plans/${id}`);
          toast.success("Plan deleted successfully");
          fetchPlans();
      } catch (err) {
          toast.error("Failed to delete plan");
      }
  };

  if (view === "form") {
    return (
       <div className="p-8 max-w-5xl mx-auto font-primary">
          <PlanForm 
             plan={currentPlan} 
             onSave={handleSave} 
             onCancel={() => setView("list")} 
          />
       </div>
    );
  }

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700 font-primary">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/60">
        <div>
          <h1 className="text-4xl font-black text-[#04040a] mb-2 tracking-tight">Subscription Plans</h1>
          <p className="text-slate-500 font-medium text-lg">Manage platform subscription modules and tiers.</p>
        </div>
        <button 
          onClick={() => { setCurrentPlan(null); setView("form"); }}
          className="h-16 px-10 bg-[#0F172A] text-white rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-[#1E293B] transition-all shadow-xl shadow-slate-200 active:scale-95 whitespace-nowrap"
        >
          <FiPlus className="w-5 h-5" /> New Plan
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-40">
           <div className="w-12 h-12 border-4 border-slate-50 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-100 p-24 text-center max-w-lg mx-auto shadow-sm">
           <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <FiPlus className="text-slate-300 w-8 h-8" />
           </div>
           <h3 className="text-2xl font-black text-[#0F172A] mb-2">No plans defined</h3>
           <p className="text-slate-400 mb-10 font-medium">Define your first subscription plan to start onboarding companies.</p>
           <button onClick={() => setView("form")} className="h-14 px-8 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-100 transition-all">Create First Plan</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan._id} className="bg-white rounded-[40px] p-10 border border-slate-100 flex flex-col hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group relative ring-1 ring-slate-50">
              <div className="absolute top-10 right-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <button onClick={() => { setCurrentPlan(plan); setView("form"); }} className="w-11 h-11 bg-white border border-slate-100 rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 text-slate-400 transition-all shadow-sm"><FiEdit2 size={16} /></button>
                  <button onClick={() => handleDelete(plan._id)} className="w-11 h-11 bg-white border border-slate-100 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:border-rose-100 hover:text-rose-500 text-slate-400 transition-all shadow-sm"><FiTrash2 size={16} /></button>
              </div>

              <div className="mb-8">
                <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${plan.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  {plan.isActive ? "Live" : "Draft"}
                </span>
              </div>

              <h2 className="text-3xl font-black text-[#0F172A] mb-3 tracking-tight">{plan.name}</h2>
              <div className="flex items-baseline gap-1.5 mb-10">
                <span className="text-4xl font-black text-[#0F172A]">₹{plan.price}</span>
                <span className="text-slate-400 font-bold text-sm">/ {plan.duration} days</span>
              </div>

              <div className="space-y-4 mb-12 flex-1">
                {plan.features?.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-50/50 flex items-center justify-center border border-indigo-100/50">
                        <FiCheck className="text-indigo-600 w-3.5 h-3.5" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-600 leading-relaxed">{f}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => { setCurrentPlan(plan); setView("form"); }}
                className="w-full h-14 bg-slate-50 text-slate-900 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-[0.98] border border-slate-100 shadow-sm"
              >
                Modify Configuration
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

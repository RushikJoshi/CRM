import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FiUser, FiPhone, FiMail, FiBriefcase, FiActivity, FiDollarSign, FiCalendar, FiCheckSquare, FiPlus, FiArrowLeft, FiMessageCircle } from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import API from "../services/api";

const CustomerDetails = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/crm/customers/${id}/360`);
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return <div className="h-[60vh] flex items-center justify-center font-black text-slate-300 uppercase tracking-widest animate-pulse">Synchronizing Intelligence...</div>;
    if (!data) return <div className="p-20 text-center font-black text-red-400 uppercase tracking-widest">Customer Record Offline.</div>;

    const { customer, contacts, deals, activities, revenue } = data;

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Navigation & Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Link to="/customers" className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-green-500 hover:border-green-100 transition-all shadow-sm">
                        <FiArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
                            {customer.name}
                            <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg border border-green-100 shadow-sm shadow-green-500/10">Active Client</span>
                        </h1>
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 opacity-80">Full-Stack Enterprise Node & Intelligence Core</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-3 px-6 py-4 bg-gray-900 text-white font-black rounded-xl shadow-xl hover:bg-gray-800 transition-all text-xs uppercase tracking-widest">
                        <FiMessageCircle size={18} />
                        WhatsApp
                    </button>
                    <button className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 transition-all text-xs uppercase tracking-widest">
                        <FiPlus size={18} />
                        Create Deal
                    </button>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Revenue Yield", val: revenue, icon: <FaIndianRupeeSign />, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Open Opportunities", val: deals.length, icon: <FiBriefcase />, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Strategic Contacts", val: contacts.length, icon: <FiUser />, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Total Engagements", val: activities.calls.length + activities.meetings.length, icon: <FiActivity />, color: "text-orange-600", bg: "bg-orange-50" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-50 flex items-center gap-5 shadow-sm">
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center text-xl shadow-inner`}>{stat.icon}</div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{stat.label}</p>
                            <h3 className={`text-2xl font-black ${stat.color} mt-0.5 tracking-tight`}>
                                {typeof stat.val === 'number' && stat.label.includes('Revenue') ? `₹${stat.val.toLocaleString('en-IN')}` : stat.val}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabbed Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Profile Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Node Metadata</h4>
                            <div className="space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400"><FiMail /></div>
                                    <span className="font-bold text-gray-700 text-sm truncate">{customer.email || "No Comms Channel"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400"><FiPhone /></div>
                                    <span className="font-bold text-gray-700 text-sm">{customer.phone || "No Terminal Link"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400"><FiActivity /></div>
                                    <span className="font-bold text-gray-700 text-sm capitalize">{customer.industry || "General Sector"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-50">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Decision Hub (Contacts)</h4>
                            <div className="space-y-4">
                                {contacts.map(c => (
                                    <div key={c._id} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-xl border border-transparent hover:border-green-100 transition-all cursor-pointer group">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-green-500 shadow-sm">{c.name.charAt(0)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-gray-800 text-sm truncate">{c.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 truncate tracking-tight">{c.role || "Technical Stakeholder"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Activities Hub */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center gap-1 bg-white p-2 rounded-2xl border border-gray-100 w-fit shadow-sm">
                        {["overview", "deals", "timeline", "notes"].map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[400px]">
                        {activeTab === "overview" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ActivityMetric title="Call Engagements" items={activities.calls} icon={<FiPhone />} />
                                <ActivityMetric title="Meeting Matrix" items={activities.meetings} icon={<FiCalendar />} />
                            </div>
                        )}

                        {activeTab === "deals" && (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Opportunity</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valuation</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">State</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {deals.map(d => (
                                            <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <p className="font-black text-gray-900">{d.title}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Owner: {d.assignedTo?.name}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="font-black text-green-600">₹{d.value?.toLocaleString('en-IN')}</span>
                                                </td>
                                                <td className="px-8 py-5 text-sm">
                                                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest italic">{d.stage}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === "timeline" && (
                            <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="space-y-12">
                                    {[...activities.calls, ...activities.meetings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((item, i) => (
                                        <div key={i} className="flex gap-8 relative">
                                            {i !== 0 && <div className="absolute top-0 bottom-0 left-[19px] w-[2px] bg-gray-50 -translate-x-1/2 -mt-12"></div>}
                                            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm relative z-10">
                                                {item.title.toLowerCase().includes('call') ? <FiPhone size={18} /> : <FiCalendar size={18} />}
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(item.createdAt).toLocaleString()}</p>
                                                <h5 className="font-black text-gray-900 mt-1 tracking-tight">{item.title}</h5>
                                                <p className="text-sm text-gray-500 font-bold mt-2 leading-relaxed italic opacity-80">"{item.description || item.outcome || "Signal logged without contextual data."}"</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActivityMetric = ({ title, items, icon }) => (
    <div className="bg-white p-8 rounded-3xl border border-gray-50 shadow-sm">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 text-gray-400 rounded-xl">{icon}</div>
                <h4 className="text-xl font-black text-gray-900 tracking-tight">{title}</h4>
            </div>
            <span className="text-3xl font-black text-gray-100 italic">{items.length}</span>
        </div>
        <div className="space-y-3">
            {items.slice(0, 3).map((item, i) => (
                <div key={i} className="p-4 bg-gray-50/50 rounded-xl text-xs font-bold text-gray-500 border border-transparent truncate">
                    {item.title}
                </div>
            ))}
            {items.length > 3 && <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center mt-4">+{items.length - 3} Operational Signals</p>}
            {items.length === 0 && <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center py-6 border-2 border-dashed border-gray-50 rounded-2xl">Signal Dormant</p>}
        </div>
    </div>
);

export default CustomerDetails;

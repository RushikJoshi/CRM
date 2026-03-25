import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    FiBriefcase, FiUsers, FiTrendingUp, FiCheckCircle, FiArrowLeft,
    FiMail, FiPhone, FiGlobe, FiMapPin, FiEdit2,
    FiLayers, FiCalendar, FiBarChart2, FiExternalLink, FiRefreshCw,
    FiActivity, FiShield, FiAlertCircle, FiSettings, FiTrash2, FiClock
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import API from "../../services/api";
import { useToast } from "../../context/ToastContext";
import CompanyPipelines from "../../components/superadmin/CompanyPipelines";

const CompanyDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [company, setCompany] = useState(null);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [leads, setLeads] = useState([]);
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    const fetchCompanyData = async () => {
        setLoading(true);
        try {
            const [companiesRes, usersRes, branchesRes, leadsRes, dealsRes] = await Promise.all([
                API.get(`/super-admin/companies`),
                API.get(`/super-admin/users?companyId=${id}`),
                API.get(`/super-admin/branches?companyId=${id}`),
                API.get(`/super-admin/leads?companyId=${id}`),
                API.get(`/super-admin/deals?companyId=${id}`),
            ]);

            const allCompanies = companiesRes.data?.data || [];
            const foundCompany = allCompanies.find(c => c._id === id);
            setCompany(foundCompany || null);

            const usersData = usersRes.data?.data || [];
            const branchesData = branchesRes.data?.data || [];
            const leadsData = leadsRes.data?.data || [];
            const dealsData = dealsRes.data?.data || [];

            setUsers(usersData);
            setBranches(branchesData);
            setLeads(leadsData);
            setDeals(dealsData);

            const wonDeals = dealsData.filter(d => d.stage === "closed_won" || d.stage === "Won");
            const revenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            const convRate = leadsData.length > 0 ? ((wonDeals.length / leadsData.length) * 100).toFixed(1) : 0;

            setStats({
                totalUsers: usersData.length,
                totalBranches: branchesData.length,
                totalLeads: leadsData.length,
                totalDeals: dealsData.length,
                revenue,
                conversionRate: convRate,
            });
        } catch (err) {
            console.error(err);
            toast?.error("Failed to load company data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCompanyData(); }, [id]);

    const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Hydrating Profile...</p>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-4">
                    <FiAlertCircle size={24} />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Company Profile Missing</h2>
                <p className="text-slate-500 text-sm mb-6">This organization record could not be located.</p>
                <button
                    onClick={() => navigate("/superadmin/companies")}
                    className="btn-saas-primary px-6 h-10"
                >
                    <FiArrowLeft size={16} /> Return to Directory
                </button>
            </div>
        );
    }

    const TABS = [
        { id: "overview", label: "Dashboard", icon: <FiBarChart2 /> },
        { id: "users", label: `Staff (${users.length})`, icon: <FiUsers /> },
        { id: "branches", label: `Offices (${branches.length})`, icon: <FiLayers /> },
        { id: "leads", label: `Leads (${leads.length})`, icon: <FiTrendingUp /> },
        { id: "deals", label: `Deals (${deals.length})`, icon: <FiCheckCircle /> },
        { id: "pipelines", label: "Settings", icon: <FiSettings /> },
    ];

    const metrics = [
        { label: "Revenue", value: formatCurrency(stats?.revenue ?? 0), icon: <FaIndianRupeeSign size={12} />, trend: "Total Won" },
        { label: "Leads", value: stats?.totalLeads ?? 0, icon: <FiTrendingUp size={12} />, trend: "Active Base" },
        { label: "Deals", value: stats?.totalDeals ?? 0, icon: <FiCheckCircle size={12} />, trend: "Pipeline" },
        { label: "Conversion", value: `${stats?.conversionRate ?? 0}%`, icon: <FiActivity size={12} />, trend: "Win Rate" },
        { label: "Branches", value: stats?.totalBranches ?? 0, icon: <FiLayers size={12} />, trend: "Operational" },
        { label: "Staff", value: stats?.totalUsers ?? 0, icon: <FiUsers size={12} />, trend: "Direct" },
    ];

    return (
        <div className="animate-fade-in space-y-6 pb-10">
            {/* Header / Brand Profile */}
            <div className="saas-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center text-slate-900 font-bold text-2xl border border-slate-200">
                        {company.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-[22px] font-bold text-slate-900 poppins leading-tight">{company.name}</h1>
                            <span className={`badge-saas ${company.status === "inactive" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                                {company.status || "active"}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-slate-500 font-medium">
                            <div className="flex items-center gap-1.5">
                                <FiMail className="text-slate-300" /> {company.email}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <FiPhone className="text-slate-300" /> {company.phone || "No contact"}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <FiGlobe className="text-slate-300" /> {company.website || "No website"}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <FiMapPin className="text-slate-300" /> {company.address || "Global HQ"}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/superadmin/companies/${id}/edit`)}
                        className="btn-saas-secondary h-9 px-4"
                    >
                        <FiEdit2 size={14} /> Edit Brand
                    </button>
                    <button
                        onClick={fetchCompanyData}
                        className="btn-saas-secondary h-9 w-9 p-0"
                    >
                        <FiRefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Metrics Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {metrics.map((m, i) => (
                    <div key={i} className="saas-card p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400">{m.icon}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.trend}</span>
                        </div>
                        <div className="text-xl font-bold text-slate-900 mb-0.5">{m.value}</div>
                        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">{m.label}</div>
                    </div>
                ))}
            </div>

            {/* Content Tabs */}
            <div className="space-y-4">
                <div className="flex items-center gap-1 border-b border-slate-200">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 text-[13px] font-semibold transition-all relative ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <span className="opacity-70">{tab.icon}</span>
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
                        </button>
                    ))}
                </div>

                <div className="animate-fade-in">
                    {activeTab === "overview" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Stats Summary could go here, or just basic lists */}
                            <div className="saas-table-container">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                        <FiTrendingUp className="text-indigo-500" /> Recent Sales Activity
                                    </h3>
                                </div>
                                <table className="saas-table">
                                    <thead>
                                        <tr>
                                            <th className="saas-th">Contact</th>
                                            <th className="saas-th">Value</th>
                                            <th className="saas-th text-right">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deals.slice(0, 5).map(deal => (
                                            <tr key={deal._id} className="saas-tr">
                                                <td className="saas-td">
                                                    <div className="font-semibold text-slate-800">{deal.title}</div>
                                                    <div className="text-[11px] text-slate-400">ID: {deal._id?.slice(-6)}</div>
                                                </td>
                                                <td className="saas-td font-bold text-slate-700">{formatCurrency(deal.value)}</td>
                                                <td className="saas-td text-right">
                                                    <span className={`badge-saas px-2 uppercase text-[9px] ${deal.stage?.includes('won') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {deal.stage?.replace('_', ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="saas-table-container">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                        <FiActivity className="text-rose-500" /> Latest Leads
                                    </h3>
                                </div>
                                <table className="saas-table">
                                    <thead>
                                        <tr>
                                            <th className="saas-th">Lead Info</th>
                                            <th className="saas-th">Status</th>
                                            <th className="saas-th text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leads.slice(0, 5).map(lead => (
                                            <tr key={lead._id} className="saas-tr">
                                                <td className="saas-td">
                                                    <div className="font-semibold text-slate-800">{lead.name}</div>
                                                    <div className="text-[11px] text-slate-400">{lead.email}</div>
                                                </td>
                                                <td className="saas-td italic font-bold">
                                                     <span className="badge-saas bg-indigo-50 text-indigo-600 text-[9px]">{lead.status}</span>
                                                </td>
                                                <td className="saas-td text-right">
                                                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                                                        <FiExternalLink size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "users" && (
                        <div className="saas-table-container">
                             <table className="saas-table">
                                 <thead>
                                     <tr>
                                         <th className="saas-th">Team Member</th>
                                         <th className="saas-th">Role</th>
                                         <th className="saas-th">Assigned Entity</th>
                                         <th className="saas-th text-right">Manage</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {users.map(u => (
                                         <tr key={u._id} className="saas-tr">
                                             <td className="saas-td">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                                                        {u.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{u.name}</div>
                                                        <div className="text-[11px] text-slate-400 font-medium">{u.email}</div>
                                                    </div>
                                                </div>
                                             </td>
                                             <td className="saas-td italic font-bold">
                                                  <span className="badge-saas bg-slate-100 text-slate-600 uppercase text-[10px]">{u.role?.replace('_', ' ')}</span>
                                             </td>
                                             <td className="saas-td text-slate-500 font-medium">
                                                 {u.branchId ? (
                                                     <div className="flex items-center gap-1.5">
                                                         <FiLayers size={12} className="text-slate-300" />
                                                         <span>{u.branchId?.name}</span>
                                                     </div>
                                                 ) : "Organization Wide"}
                                             </td>
                                             <td className="saas-td text-right">
                                                 <button className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded">
                                                     <FiEdit2 size={13} />
                                                 </button>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                        </div>
                    )}

                    {activeTab === "branches" && (
                        <div className="saas-table-container">
                            <table className="saas-table">
                                <thead>
                                    <tr>
                                        <th className="saas-th">Branch / Location</th>
                                        <th className="saas-th">Contact</th>
                                        <th className="saas-th">Status</th>
                                        <th className="saas-th text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branches.map(b => (
                                        <tr key={b._id} className="saas-tr">
                                            <td className="saas-td">
                                                <div className="font-semibold text-slate-900">{b.name}</div>
                                                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                                    <FiMapPin size={10} /> {b.address || "Main Site"}
                                                </div>
                                            </td>
                                            <td className="saas-td text-slate-500 text-[13px]">{b.email || "No email"}</td>
                                            <td className="saas-td">
                                                <span className={`badge-saas ${b.status === "inactive" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                                                    {b.status || "active"}
                                                </span>
                                            </td>
                                            <td className="saas-td text-right">
                                                <button className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded">
                                                     <FiEdit2 size={13} />
                                                 </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "leads" && (
                        <div className="saas-table-container">
                            <table className="saas-table">
                                <thead>
                                    <tr>
                                        <th className="saas-th">Lead Details</th>
                                        <th className="saas-th">Source / Assignment</th>
                                        <th className="saas-th">Lifecycle</th>
                                        <th className="saas-th text-right">Open</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map(lead => (
                                        <tr key={lead._id} className="saas-tr">
                                            <td className="saas-td">
                                                <div className="font-semibold text-slate-900">{lead.name}</div>
                                                <div className="text-[11px] text-slate-400">{lead.email}</div>
                                            </td>
                                            <td className="saas-td">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <FiUser size={12} className="text-slate-300" />
                                                    <span className="text-[13px]">{lead.assignedTo?.name || "Unassigned"}</span>
                                                </div>
                                            </td>
                                            <td className="saas-td">
                                                <span className={`badge-saas uppercase text-[9px] ${lead.status === "new" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="saas-td text-right">
                                                <button className="text-slate-400 hover:text-indigo-600">
                                                    <FiExternalLink size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "deals" && (
                        <div className="saas-table-container">
                            <table className="saas-table">
                                <thead>
                                    <tr>
                                        <th className="saas-th">Deal Title</th>
                                        <th className="saas-th">Financial Value</th>
                                        <th className="saas-th">Owner</th>
                                        <th className="saas-th">Pipeline State</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deals.map(deal => (
                                        <tr key={deal._id} className="saas-tr">
                                            <td className="saas-td font-semibold text-slate-900">{deal.title}</td>
                                            <td className="saas-td font-bold text-indigo-600">{formatCurrency(deal.value)}</td>
                                            <td className="saas-td text-slate-500 italic font-bold">
                                                <span className="text-[13px]">{deal.assignedTo?.name || "Shared"}</span>
                                            </td>
                                            <td className="saas-td">
                                                <span className={`badge-saas uppercase text-[9px] ${deal.stage?.includes('won') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {deal.stage?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "pipelines" && (
                        <div className="saas-card">
                             <CompanyPipelines companyId={id} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompanyDetailPage;

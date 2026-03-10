import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    FiBriefcase, FiUsers, FiTrendingUp, FiCheckCircle, FiArrowLeft,
    FiMail, FiPhone, FiGlobe, FiMapPin, FiEdit2,
    FiLayers, FiCalendar, FiBarChart2, FiExternalLink, FiRefreshCw,
    FiActivity, FiShield, FiAlertCircle
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import API from "../../services/api";
import { useToast } from "../../context/ToastContext";

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
            // Fetch company details (from companies list, filtered by id)
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

            const wonDeals = dealsData.filter(d => d.stage === "closed_won");
            const revenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            const convRate = leadsData.length > 0 ? ((wonDeals.length / leadsData.length) * 100).toFixed(1) : 0;

            setStats({
                totalUsers: usersData.length,
                totalBranches: branchesData.length,
                totalLeads: leadsData.length,
                totalDeals: dealsData.length,
                revenue,
                conversionRate: convRate,
                activeLeads: leadsData.filter(l => l.status === "new" || l.status === "contacted").length,
                wonDeals: wonDeals.length,
            });
        } catch (err) {
            console.error(err);
            toast?.error("Failed to load company data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCompanyData(); }, [id]);

    const handleDeleteCompany = async () => {
        if (!window.confirm(`Delete "${company?.name}"? This will remove all associated data permanently.`)) return;
        try {
            await API.delete(`/super-admin/companies/${id}`);
            toast?.success("Company deleted.");
            navigate("/superadmin/companies");
        } catch (err) {
            toast?.error(err.response?.data?.message || "Failed to delete company.");
        }
    };

    const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-green-100 border-t-green-500 rounded-full animate-spin" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Company...</p>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-400 mb-4">
                    <FiAlertCircle size={28} />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2">Company Not Found</h2>
                <p className="text-gray-500 mb-6">This company may have been deleted or the ID is invalid.</p>
                <button
                    onClick={() => navigate("/superadmin/companies")}
                    className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white font-black rounded-xl text-sm uppercase tracking-widest hover:bg-green-600 transition-all"
                >
                    <FiArrowLeft size={16} />
                    Back to Companies
                </button>
            </div>
        );
    }

    const TABS = [
        { id: "overview", label: "Overview", icon: <FiBarChart2 size={15} /> },
        { id: "users", label: `Users (${stats?.totalUsers ?? 0})`, icon: <FiUsers size={15} /> },
        { id: "branches", label: `Branches (${stats?.totalBranches ?? 0})`, icon: <FiLayers size={15} /> },
        { id: "leads", label: `Leads (${stats?.totalLeads ?? 0})`, icon: <FiTrendingUp size={15} /> },
        { id: "deals", label: `Deals (${stats?.totalDeals ?? 0})`, icon: <FiCheckCircle size={15} /> },
    ];

    const statCards = [
        { label: "Users", value: stats?.totalUsers ?? 0, icon: <FiUsers />, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Branches", value: stats?.totalBranches ?? 0, icon: <FiLayers />, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Leads", value: stats?.totalLeads ?? 0, icon: <FiTrendingUp />, color: "text-green-600", bg: "bg-green-50" },
        { label: "Deals", value: stats?.totalDeals ?? 0, icon: <FiCheckCircle />, color: "text-orange-600", bg: "bg-orange-50" },
        { label: "Revenue", value: formatCurrency(stats?.revenue ?? 0), icon: <FaIndianRupeeSign />, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Conversion", value: `${stats?.conversionRate ?? 0}%`, icon: <FiActivity />, color: "text-rose-600", bg: "bg-rose-50" },
    ];

    return (
        <div className="space-y-5 pb-10 animate-in fade-in duration-500">
            {/* ─── Breadcrumb & Actions ──────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/superadmin/companies")}
                        className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-gray-500"
                    >
                        <FiArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                            <Link to="/superadmin/companies" className="hover:text-green-600 transition-colors">Companies</Link>
                            <span>/</span>
                            <span className="text-gray-600">{company.name}</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900">{company.name}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchCompanyData}
                        className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-gray-500 border border-gray-100"
                    >
                        <FiRefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => navigate(`/superadmin/companies/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm shadow-sm"
                    >
                        <FiEdit2 size={15} />
                        Edit
                    </button>

                </div>
            </div>

            {/* ─── Company Header Card ───────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
                <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                        {/* Avatar */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg shadow-green-500/20 flex-shrink-0">
                            {company.name?.charAt(0)?.toUpperCase()}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h2 className="text-xl sm:text-2xl font-black text-gray-900">{company.name}</h2>
                                <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border ${company.status === "inactive" ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                                    {company.status || "active"}
                                </span>
                                {company.industry && (
                                    <span className="text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200">
                                        {company.industry}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
                                {company.email && (
                                    <a href={`mailto:${company.email}`} className="flex items-center gap-1.5 hover:text-green-600 transition-colors">
                                        <FiMail size={14} /> {company.email}
                                    </a>
                                )}
                                {company.phone && (
                                    <a href={`tel:${company.phone}`} className="flex items-center gap-1.5 hover:text-green-600 transition-colors">
                                        <FiPhone size={14} /> {company.phone}
                                    </a>
                                )}
                                {company.website && (
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-green-600 transition-colors">
                                        <FiGlobe size={14} /> {company.website.replace(/https?:\/\//, '')}
                                    </a>
                                )}
                                {company.address && (
                                    <span className="flex items-center gap-1.5">
                                        <FiMapPin size={14} /> {company.address}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 font-bold mt-2 flex items-center gap-1.5">
                                <FiCalendar size={11} />
                                Joined {new Date(company.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Stats Row ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {statCards.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all">
                        <div className={`w-8 h-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center text-sm mb-2`}>
                            {s.icon}
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-gray-900">{s.value}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* ─── Tabs ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 overflow-x-auto">
                    <div className="flex px-5 min-w-max">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-5 sm:p-6">
                    {/* ── Overview Tab ── */}
                    {activeTab === "overview" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Leads */}
                            <div>
                                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <FiTrendingUp className="text-green-500" /> Recent Leads
                                </h3>
                                <div className="space-y-2">
                                    {leads.slice(0, 5).map(lead => (
                                        <div key={lead._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-black text-sm flex-shrink-0">
                                                {lead.name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate">{lead.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{lead.status}</p>
                                            </div>
                                            <span className="text-[9px] px-2 py-1 bg-green-100 text-green-700 rounded-lg font-black uppercase flex-shrink-0">{lead.status}</span>
                                        </div>
                                    ))}
                                    {leads.length === 0 && <p className="text-center text-gray-400 text-sm py-6 font-medium">No leads yet</p>}
                                </div>
                            </div>
                            {/* Recent Deals */}
                            <div>
                                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <FiCheckCircle className="text-orange-500" /> Recent Deals
                                </h3>
                                <div className="space-y-2">
                                    {deals.slice(0, 5).map(deal => (
                                        <div key={deal._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                                                <FaIndianRupeeSign size={13} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate">{deal.title}</p>
                                                <p className="text-[10px] font-bold text-orange-600/70">{formatCurrency(deal.value)}</p>
                                            </div>
                                            <span className="text-[9px] px-2 py-1 bg-orange-100 text-orange-700 rounded-lg font-black uppercase flex-shrink-0">{deal.stage?.replace('_', ' ')}</span>
                                        </div>
                                    ))}
                                    {deals.length === 0 && <p className="text-center text-gray-400 text-sm py-6 font-medium">No deals yet</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Users Tab ── */}
                    {activeTab === "users" && (
                        <div className="space-y-3">
                            {users.length === 0 ? (
                                <div className="text-center py-12">
                                    <FiUsers size={32} className="text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400 font-bold text-sm">No users in this company</p>
                                </div>
                            ) : users.map(u => (
                                <div key={u._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black flex-shrink-0">
                                        {u.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900">{u.name}</p>
                                        <p className="text-xs text-gray-400 font-medium">{u.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg font-black uppercase tracking-widest">{u.role?.replace('_', ' ')}</span>
                                        {u.branchId && (
                                            <span className="text-[10px] px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg font-black uppercase tracking-widest">{u.branchId?.name}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Branches Tab ── */}
                    {activeTab === "branches" && (
                        <div className="space-y-3">
                            {branches.length === 0 ? (
                                <div className="text-center py-12">
                                    <FiLayers size={32} className="text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400 font-bold text-sm">No branches in this company</p>
                                </div>
                            ) : branches.map(b => (
                                <div key={b._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black flex-shrink-0">
                                        <FiLayers size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900">{b.name}</p>
                                        {b.address && <p className="text-xs text-gray-400 font-medium flex items-center gap-1"><FiMapPin size={11} /> {b.address}</p>}
                                    </div>
                                    <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border ${b.status === "inactive" ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                                        {b.status || "active"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Leads Tab ── */}
                    {activeTab === "leads" && (
                        <div className="space-y-3">
                            {leads.length === 0 ? (
                                <div className="text-center py-12">
                                    <FiTrendingUp size={32} className="text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400 font-bold text-sm">No leads for this company</p>
                                </div>
                            ) : leads.map(lead => (
                                <div key={lead._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-black flex-shrink-0">
                                        {lead.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900">{lead.name}</p>
                                        <p className="text-xs text-gray-400 font-medium">{lead.email} {lead.phone ? `· ${lead.phone}` : ''}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {lead.assignedTo && (
                                            <span className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-lg font-bold">
                                                {lead.assignedTo?.name}
                                            </span>
                                        )}
                                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest ${lead.status === "new" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                            {lead.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Deals Tab ── */}
                    {activeTab === "deals" && (
                        <div className="space-y-3">
                            {deals.length === 0 ? (
                                <div className="text-center py-12">
                                    <FiCheckCircle size={32} className="text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400 font-bold text-sm">No deals for this company</p>
                                </div>
                            ) : deals.map(deal => (
                                <div key={deal._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                                        <FaIndianRupeeSign size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900">{deal.title}</p>
                                        <p className="text-xs font-black text-orange-600/70">{formatCurrency(deal.value)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {deal.assignedTo && (
                                            <span className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-lg font-bold">
                                                {deal.assignedTo?.name}
                                            </span>
                                        )}
                                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest ${deal.stage === "closed_won" ? "bg-green-100 text-green-700" : deal.stage === "closed_lost" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-700"}`}>
                                            {deal.stage?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompanyDetailPage;

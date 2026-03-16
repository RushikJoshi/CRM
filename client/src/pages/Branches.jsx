import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import BranchTable from "../components/BranchTable";
import Pagination from "../components/Pagination";
import { FiPlus, FiSearch, FiFilter, FiLayers } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

function Branches() {
    const [branches, setBranches] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;
    const navigate = useNavigate();
    const toast = useToast();

    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/branches" : "/branches";

    const formBase = (() => {
        const path = window.location.pathname;
        if (path.startsWith("/superadmin")) return "/superadmin/branches";
        if (path.startsWith("/company")) return "/company/branches";
        return "/branches";
    })();

    const [statusFilter, setStatusFilter] = useState("");

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
            if (search) params.set("search", search);
            if (statusFilter) params.set("status", statusFilter);
            if (isSuperAdmin && selectedCompany) params.set("companyId", selectedCompany);
            const res = await API.get(`${apiBase}?${params.toString()}`);
            const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setBranches(data);
            setTotalPages(res.data?.totalPages ?? 1);
            setTotal(res.data?.total ?? 0);
        } catch {
            setBranches([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        if (!isSuperAdmin) return;
        try {
            const res = await API.get("/super-admin/companies");
            const companyList = res.data?.data || res.data?.companies || [];
            setCompanies(companyList);
        } catch { /* silent */ }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this branch? This will soft-delete the branch.")) return;
        try {
            await API.delete(`${apiBase}/${id}`);
            toast.success("Branch deleted.");
            fetchBranches();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete branch.");
        }
    };

    const handleToggleStatus = async (branch) => {
        try {
            await API.patch(`${apiBase}/${branch._id}/toggle-status`);
            toast.success(`Branch marked as ${branch.status === "active" ? "Inactive" : "Active"}.`);
            fetchBranches();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update status.");
        }
    };

    useEffect(() => { setPage(1); }, [search, selectedCompany, statusFilter]);
    useEffect(() => { fetchBranches(); }, [search, selectedCompany, statusFilter, page]);
    useEffect(() => { fetchCompanies(); }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-16">
            {/* Branch Management Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none" />
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-14 h-14 bg-sky-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:rotate-6 transition-transform hover:scale-105">
                        <FiLayers size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Branches List</h1>
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-80 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                            Manage your company branches and locations
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 relative z-10 w-full lg:w-auto">
                    {/* Integrated Search Filter */}
                    <div className="relative group w-full lg:w-64">
                        <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search branches..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-sm shadow-sm placeholder-gray-300"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {isSuperAdmin && companies.length > 0 && (
                        <div className="relative group w-full lg:w-64">
                            <FiFilter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                            <select
                                className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-sm appearance-none shadow-sm cursor-pointer"
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                            >
                                <option value="">All Companies</option>
                                {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    <select
                        className="w-full lg:w-40 pl-4 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-sm appearance-none shadow-sm cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="closed">Closed</option>
                    </select>

                    <button
                        onClick={() => navigate(`${formBase}/create`)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-3.5 bg-sky-500 text-white font-black rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest min-w-[180px]"
                    >
                        <FiPlus size={20} strokeWidth={3} />
                        Add New Branch
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center space-y-6 bg-white/50 rounded-[40px] border border-gray-100 border-dashed animate-pulse">
                    <div className="w-12 h-12 border-[4px] border-sky-50 border-t-sky-500 rounded-full animate-spin shadow-lg"></div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[11px]">Loading branches...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <BranchTable
                        branches={branches}
                        onEdit={(b) => navigate(`${formBase}/${b._id}/edit`)}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                    />
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                </div>
            )}
        </div>
    );
}

export default Branches;

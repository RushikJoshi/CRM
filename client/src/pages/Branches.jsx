import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import BranchTable from "../components/BranchTable";
import Pagination from "../components/Pagination";
import { FiPlus, FiSearch, FiFilter, FiX } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

function Branches() {
    const [branches, setBranches] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;
    
    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.role === "super_admin";
    const isSales = currentUser?.role === "sales";
    const rolePath = isSuperAdmin ? "/superadmin" : isSales ? "/sales" : currentUser?.role === "branch_manager" ? "/branch" : "/company";

    const navigate = useNavigate();
    const toast = useToast();
    const apiBase = isSuperAdmin ? "/super-admin/branches" : "/branches";

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ 
                page: String(page), 
                limit: String(pageSize),
                search: search,
                status: statusFilter
            });
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
            setCompanies(res.data?.data || res.data?.companies || []);
        } catch { /* silent */ }
    };

    const handleDelete = async (branch) => {
        if (!window.confirm("Delete this branch? This will soft-delete the branch.")) return;
        try {
            await API.delete(`${apiBase}/${branch._id}`);
            toast.success("Branch deleted successfully.");
            fetchBranches();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete branch.");
        }
    };

    const handleToggleStatus = async (branch) => {
        try {
            await API.patch(`${apiBase}/${branch._id}/toggle-status`);
            toast.success(`Branch status updated.`);
            fetchBranches();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update status.");
        }
    };


    useEffect(() => { setPage(1); }, [search, selectedCompany, statusFilter]);
    useEffect(() => { fetchBranches(); }, [search, selectedCompany, statusFilter, page]);
    useEffect(() => { fetchCompanies(); }, []);

    return (
        <div className="animate-fade-in space-y-3 pb-4">
            {/* Excel Filter Header */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
                <div className="relative group min-w-[240px]">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={12} />
                    <input
                        type="text"
                        placeholder="Search branches..."
                        className="w-full h-8 pl-9 pr-3 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium outline-none focus:bg-white focus:border-emerald-600/20 focus:ring-4 focus:ring-emerald-600/5 transition-all text-slate-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="h-4 w-px bg-slate-100 mx-1" />

                <div className="flex items-center gap-3 flex-1">
                    {isSuperAdmin && (
                        <div className="relative">
                            <FiBriefcase size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                className="h-8 pl-8 pr-8 bg-slate-50 border border-transparent rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-600/20 transition-all appearance-none cursor-pointer min-w-[150px]"
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                            >
                                <option value="">All Companies</option>
                                {companies.map((c) => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <div className="relative">
                        <FiFilter size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            className="h-8 pl-8 pr-8 bg-slate-50 border border-transparent rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-600/20 transition-all appearance-none cursor-pointer min-w-[130px]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="h-4 w-px bg-slate-100 mx-1" />

                <button
                    onClick={() => navigate(`${rolePath}/branches/create`)}
                    className="h-8 px-4 bg-emerald-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shrink-0 shadow-sm"
                >
                    <FiPlus size={14} /> Add Branch
                </button>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Hydrating Records...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <BranchTable
                        branches={branches}
                        onEdit={(b) => navigate(`${rolePath}/branches/${b._id}/edit`)}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                    />
                    <div className="flex items-center justify-between">
                         <div className="text-[12px] text-slate-500 font-medium">
                            Showing <span className="text-slate-900 font-bold">{branches.length}</span> of <span className="text-slate-900 font-bold">{total}</span> total branches
                         </div>
                         <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Branches;

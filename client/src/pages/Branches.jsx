import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import BranchTable from "../components/BranchTable";
import Pagination from "../components/Pagination";
import { FiPlus, FiSearch } from "react-icons/fi";
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
    const pageSize = 10;
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
        <div className="p-6 space-y-6 animate-in fade-in duration-700">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex-1 min-w-[300px] relative group">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search branches..."
                        className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-gray-700 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {isSuperAdmin && (
                        <select
                            className="bg-gray-100 border-none rounded-lg px-3 py-2 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-teal-500/20"
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                        >
                            <option value="">All Companies</option>
                            {companies.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    )}
                    <select
                        className="bg-gray-100 border-none rounded-lg px-3 py-2 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-teal-500/20"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border shadow-sm p-12 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-teal-50 border-t-teal-600 rounded-full animate-spin" />
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Loading Branches...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border shadow-sm p-4 overflow-hidden">
                        <BranchTable
                            branches={branches}
                            onEdit={(b) => navigate(`${formBase}/${b._id}/edit`)}
                            onDelete={handleDelete}
                            onToggleStatus={handleToggleStatus}
                        />
                    </div>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                </div>
            )}
        </div>
    );
}

export default Branches;

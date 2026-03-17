import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import BranchTable from "../components/BranchTable";
import Pagination from "../components/Pagination";
import { FiPlus } from "react-icons/fi";
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
        <div className="space-y-8 animate-in fade-in duration-700 pb-16">
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => navigate(`${formBase}/create`)}
                    className="flex items-center justify-center gap-3 px-8 py-3.5 bg-sky-500 text-white font-black rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest min-w-[180px]"
                >
                    <FiPlus size={20} strokeWidth={3} />
                    Add New Branch
                </button>
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

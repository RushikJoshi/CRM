import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiFilter, FiSearch } from "react-icons/fi";
import API from "../services/api";
import BranchTable from "../components/BranchTable";
import Pagination from "../components/Pagination";
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
  const apiBase = isSuperAdmin ? "/super-admin/branches" : "/branches";

  const navigate = useNavigate();
  const toast = useToast();

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search,
        status: statusFilter,
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
    } catch {
      // ignore
    }
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
      toast.success("Branch status updated.");
      fetchBranches();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, selectedCompany, statusFilter]);

  useEffect(() => {
    fetchBranches();
  }, [search, selectedCompany, statusFilter, page]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <div className="crm-page animate-fade-in space-y-3 pb-4">
      <div className="crm-toolbar">
        <div className="relative group min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
          <input
            type="text"
            placeholder="Search branches..."
            className="crm-input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="h-4 w-px bg-slate-100 mx-1" />

        <div className="flex items-center gap-3 flex-1">
          {isSuperAdmin && (
            <div className="relative">
              <FiBriefcase size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select className="crm-input pl-8 pr-8 min-w-[150px]" value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <FiFilter size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select className="crm-input pl-8 pr-8 min-w-[130px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="crm-card p-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Loading branches...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <BranchTable
            branches={branches}
            onView={(b) => navigate(`${rolePath}/branches/${b._id}`)}
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


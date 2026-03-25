import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import CompanyTable from "../components/CompanyTable";
import Pagination from "../components/Pagination";
import { FiPlus, FiSearch } from "react-icons/fi";
import { useToast } from "../context/ToastContext";

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const navigate = useNavigate();
  const toast = useToast();

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/super-admin/companies?search=${search}&page=${page}&limit=${pageSize}`);
      const companiesData = res.data?.data || res.data?.companies || [];
      if (companiesData) {
        setCompanies(companiesData);
        setTotalPages(res.data?.totalPages || 1);
        setTotal(res.data?.total ?? companiesData.length);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error(err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    toast.confirm({
      message: "Are you sure you want to delete this company?",
      cancelText: "Cancel",
      confirmText: "Delete",
      type: "warning",
      onConfirm: async () => {
        try {
          await API.delete(`/super-admin/companies/${id}`);
          toast.success("Company deleted successfully.", 3000);
          fetchCompanies();
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to delete company.");
        }
      },
    });
  };

  // Navigate to full-page form instead of opening a modal
  const handleEditClick = (company) => {
    navigate(`/superadmin/companies/${company._id}/edit`);
  };

  useEffect(() => { fetchCompanies(); }, [page, search]);

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 poppins">Companies</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Manage and monitor all organizations on the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter companies..."
              className="w-full pl-9 pr-4 h-9 bg-white border border-slate-200 rounded-md outline-none focus:border-indigo-500 transition-all text-sm text-slate-700"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button
            onClick={() => navigate("/superadmin/companies/create")}
            className="btn-saas-primary h-9 px-5"
          >
            <FiPlus size={16} />
            Add Company
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] saas-table-container flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-[12px] font-medium">Loading records...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="saas-table-container">
             <CompanyTable companies={companies} onEdit={handleEditClick} onDelete={handleDelete} />
          </div>
          <div className="flex justify-end">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Companies;

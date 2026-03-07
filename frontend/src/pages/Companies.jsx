import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import CompanyTable from "../components/CompanyTable";
import { FiPlus, FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useToast } from "../context/ToastContext";

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/super-admin/companies?search=${search}&page=${page}`);
      if (res.data?.companies) {
        setCompanies(res.data.companies);
        setTotalPages(res.data.totalPages || 1);
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
    if (!window.confirm("Delete this company? All its users and branches will also be removed.")) return;
    try {
      await API.delete(`/super-admin/companies/${id}`);
      toast.success("Company deleted successfully.");
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete company.");
    }
  };

  // Navigate to full-page form instead of opening a modal
  const handleEditClick = (company) => {
    navigate(`/superadmin/companies/${company._id}/edit`);
  };

  useEffect(() => { fetchCompanies(); }, [page, search]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Enterprise Companies</h1>
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">
            Manage and scale company-level CRM resources globally.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group flex-1 lg:w-64">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            <input
              type="text"
              placeholder="Search companies..."
              className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button
            onClick={() => navigate("/superadmin/companies/create")}
            className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            <FiPlus size={20} />
            Add Company
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] bg-white rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center space-y-4 animate-pulse shadow-sm">
          <div className="w-12 h-12 border-[6px] border-green-50 border-t-green-500 rounded-full animate-spin" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Loading Companies...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <CompanyTable companies={companies} onEdit={handleEditClick} onDelete={handleDelete} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-8 py-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={`p-2.5 rounded-xl border border-gray-100 transition-all ${page === 1 ? 'opacity-20 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50 text-gray-600 shadow-sm active:scale-90 bg-white'}`}>
                  <FiChevronLeft size={20} />
                </button>
                <div className="flex gap-1.5 px-2">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === i + 1 ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-gray-400 hover:bg-gray-50'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={`p-2.5 rounded-xl border border-gray-100 transition-all ${page === totalPages ? 'opacity-20 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50 text-gray-600 shadow-sm active:scale-90 bg-white'}`}>
                  <FiChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Companies;
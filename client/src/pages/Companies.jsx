import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import CompanyTable from "../components/CompanyTable";
import AddCompanyModal from "../components/AddCompanyModal";
import Pagination from "../components/Pagination";
import { FiPlus, FiSearch, FiX } from "react-icons/fi";
import { useToast } from "../context/ToastContext";

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  
  const [activeTask, setActiveTask] = useState(null); // 'create', 'edit'
  const [editingCompany, setEditingCompany] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/super-admin/companies?search=${search}&page=${page}&limit=${pageSize}`);
      const companiesData = res.data?.data || res.data?.companies || [];
      setCompanies(companiesData);
      setTotalPages(res.data?.totalPages || 1);
      setTotal(res.data?.total ?? companiesData.length);
    } catch (err) {
      console.error(err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;
    try {
        await API.delete(`/super-admin/companies/${id}`);
        toast.success("Company deleted successfully.");
        fetchCompanies();
    } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete company.");
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
        if (activeTask === 'edit' && editingCompany) {
            await API.put(`/super-admin/companies/${editingCompany._id}`, formData);
            toast.success("Company updated successfully.");
        } else {
            await API.post("/super-admin/companies", formData);
            toast.success("New company onboarded successfully.");
        }
        setActiveTask(null);
        setEditingCompany(null);
        fetchCompanies();
    } catch (err) {
        toast.error(err.response?.data?.message || "Operation failed.");
    }
  };

  useEffect(() => { fetchCompanies(); }, [page, search]);

  const closeTask = () => {
    setActiveTask(null);
    setEditingCompany(null);
  };

  if (activeTask === 'create' || activeTask === 'edit') {
      return (
          <div className="animate-fade-in bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
              <AddCompanyModal 
                  isOpen={true} 
                  onClose={closeTask} 
                  onSubmit={handleFormSubmit}
                  editingData={editingCompany}
                  isStandalone={true}
              />
          </div>
      );
  }

  return (
    <div className="animate-fade-in space-y-3 pb-4">
        {/* Excel Filter Header */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
            <div className="relative group min-w-[240px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={12} />
                <input
                    type="text"
                    placeholder="Search companies by name or ID..."
                    className="w-full h-8 pl-9 pr-3 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium outline-none focus:bg-white focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-600/5 transition-all text-slate-700"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <div className="h-4 w-px bg-slate-100 mx-1" />

            <button
                onClick={() => setActiveTask('create')}
                className="btn-saas-primary h-8 px-4 text-[11px] gap-2 ml-auto"
            >
                <FiPlus size={14} /> Onboard Company
            </button>
        </div>

        {loading ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Hydrating Records...</p>
            </div>
        ) : (
            <div className="space-y-4">
                <CompanyTable 
                  companies={companies} 
                  onEdit={(c) => { setEditingCompany(c); setActiveTask('edit'); }} 
                  onDelete={handleDelete} 
                />
                <div className="flex items-center justify-between">
                     <div className="text-[12px] text-slate-500 font-medium">
                        Showing <span className="text-slate-900 font-bold">{companies.length}</span> of <span className="text-slate-900 font-bold">{total}</span> total companies
                     </div>
                     <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                </div>
            </div>
        )}
    </div>
  );
}

export default Companies;

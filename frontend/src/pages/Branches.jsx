import { useEffect, useState } from "react";
import API from "../services/api";
import BranchTable from "../components/BranchTable";
import AddBranchModal from "../components/AddBranchModal";
import { FiPlus, FiSearch, FiLayers, FiFilter } from "react-icons/fi";

function Branches() {
    const [branches, setBranches] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role;
    const isSuperAdmin = role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/branches" : "/branches";

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const url = `${apiBase}?search=${search}${isSuperAdmin ? `&companyId=${selectedCompany}` : ""}`;
            const res = await API.get(url);
            setBranches(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        if (!isSuperAdmin) return;
        try {
            const res = await API.get("/super-admin/companies");
            setCompanies(res.data.companies || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddOrEdit = async (formData) => {
        try {
            if (editingBranch) {
                await API.put(`${apiBase}/${editingBranch._id}`, formData);
            } else {
                await API.post(apiBase, formData);
            }
            fetchBranches();
            setIsModalOpen(false);
            setEditingBranch(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Confirm decommissioning of decentralized node? Sub-resources may be affected.")) {
            try {
                await API.delete(`${apiBase}/${id}`);
                fetchBranches();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleEditClick = (branch) => {
        setEditingBranch(branch);
        setIsModalOpen(true);
    };

    useEffect(() => {
        fetchBranches();
    }, [search, selectedCompany]);

    useEffect(() => {
        fetchCompanies();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Node Branches</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">Configure and manage regional identity nodes across the global infrastructure.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group flex-1 lg:w-48">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search nodes..."
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative group w-full lg:w-48">
                        <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <select
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm appearance-none shadow-sm cursor-pointer"
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                        >
                            <option value="">Global Filter...</option>
                            {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={() => { setEditingBranch(null); setIsModalOpen(true); }}
                        className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        <FiPlus size={20} />
                        Initialize Node
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] bg-white rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center space-y-4 shadow-sm">
                    <div className="w-12 h-12 border-[6px] border-green-50 border-t-green-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Accessing Distributed Storage...</p>
                </div>
            ) : (
                <BranchTable
                    branches={branches}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                />
            )}

            <AddBranchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddOrEdit}
                editingData={editingBranch}
            />
        </div>
    );
}

export default Branches;

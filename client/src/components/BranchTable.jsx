import React from "react";
import { FiEdit2, FiTrash2, FiMapPin, FiBriefcase, FiUser, FiPhone } from "react-icons/fi";

const BRANCH_TYPE_LABELS = {
  head_office: "Head Office",
  regional_office: "Regional Office",
  sales_branch: "Sales Branch",
  support_center: "Support Center",
  warehouse: "Warehouse",
};

const BranchTable = ({ branches, onEdit, onDelete, onToggleStatus }) => {
  return (
    <div className="saas-table-excel-container">
      <table className="saas-table-excel">
        <thead>
          <tr>
            <th className="saas-th-excel">Branch Name</th>
            <th className="saas-th-excel">Branch Code</th>
            <th className="saas-th-excel">Branch Type</th>
            <th className="saas-th-excel">Status</th>
            <th className="saas-th-excel">Branch Manager</th>
            <th className="saas-th-excel">Contact Info</th>
            <th className="saas-th-excel text-right px-6">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {branches.length > 0 ? (
            branches.map((branch) => (
              <tr key={branch._id} className="saas-tr-excel group">
                <td className="saas-td-excel">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[9px] uppercase shrink-0 border border-slate-200">
                      {branch.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-[12px] truncate transition-colors leading-tight">{branch.name}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter truncate opacity-70">
                        {branch.city || "No City"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="saas-td-excel text-[12px] font-bold text-slate-600 tracking-tight">
                  {branch.branchCode || "—"}
                </td>
                <td className="saas-td-excel text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {BRANCH_TYPE_LABELS[branch.branchType] || branch.branchType || "—"}
                </td>
                <td className="saas-td-excel">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-block ${
                      branch.status === "active"
                        ? "bg-emerald-50 text-emerald-600"
                        : branch.status === "closed"
                        ? "bg-slate-100 text-slate-400"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {branch.status || "—"}
                  </span>
                </td>
                <td className="saas-td-excel text-[12px] font-bold text-slate-700 uppercase tracking-tight">
                  {branch.branchManagerId?.name || "Unassigned"}
                </td>
                <td className="saas-td-excel">
                  <div className="flex flex-col leading-tight">
                    <span className="text-[12px] font-bold text-slate-700">{branch.phone || branch.managerPhone || "—"}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter opacity-80">{branch.email || "—"}</span>
                  </div>
                </td>
                <td className="saas-td-excel text-right px-6">
                  <div className="flex items-center justify-end gap-1.5 translate-x-3">
                    {onToggleStatus && branch.status !== "closed" && (
                      <button 
                        onClick={() => onToggleStatus(branch)} 
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Toggle Status"
                      >
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                      </button>
                    )}
                    <button 
                      onClick={() => onEdit(branch)} 
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                      title="Edit Branch"
                    >
                      <FiEdit2 size={13} />
                    </button>
                    <button 
                      onClick={() => onDelete?.(branch)} 
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete Branch"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="px-6 py-20 text-center bg-white">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No branch records found</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BranchTable;

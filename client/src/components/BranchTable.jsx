import React from "react";
import { FiEdit2 } from "react-icons/fi";

const BRANCH_TYPE_LABELS = {
  head_office: "Head Office",
  regional_office: "Regional Office",
  sales_branch: "Sales Branch",
  support_center: "Support Center",
  warehouse: "Warehouse",
};

const getStatusLabel = (status) => {
  if (status === "active") return "ACTIVE";
  if (status === "inactive") return "INACTIVE";
  if (status === "closed") return "CLOSED";
  if (status === "draft") return "DRAFT";
  return String(status || "UNKNOWN").toUpperCase();
};

const BranchTable = ({ branches, onEdit, onView, onDelete, onToggleStatus }) => {
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
              <tr
                key={branch._id}
                className="saas-tr-excel group cursor-pointer"
                onClick={() => onView?.(branch)}
              >
                <td className="saas-td-excel">
                  <div className="flex items-center gap-2.5">
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
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      if (branch.status === "draft" || branch.status === "closed") return;
                      onToggleStatus?.(branch);
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-block transition-all ${
                      branch.status === "active"
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 active:scale-95 cursor-pointer"
                        : branch.status === "inactive"
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100 hover:scale-105 active:scale-95 cursor-pointer"
                        : branch.status === "draft"
                        ? "bg-amber-50 text-amber-700 cursor-default"
                        : "bg-slate-100 text-slate-600 cursor-default"
                    }`}
                  >
                    {getStatusLabel(branch.status)}
                  </button>
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
                  <div className="flex items-center justify-end gap-3 translate-x-3">
                    <button 
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(branch);
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-amber-600 uppercase tracking-widest transition-all"
                    >
                      <FiEdit2 size={13} /> Edit
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

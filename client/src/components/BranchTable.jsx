import React from "react";
import { FiEdit2, FiMapPin, FiPhone, FiLayers, FiUser, FiToggleLeft, FiTrash2 } from "react-icons/fi";

const BRANCH_TYPE_LABELS = {
  head_office: "Head Office",
  regional_office: "Regional Office",
  sales_branch: "Sales Branch",
  support_center: "Support Center",
  warehouse: "Warehouse",
};

const BranchTable = ({ branches, onEdit, onDelete, onToggleStatus }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden min-h-[400px]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
              <th className="px-4 py-3 text-[13px] font-semibold text-[#6B7280] uppercase tracking-[0.03em] sticky top-0 bg-[#F3F4F6]">Branch</th>
              <th className="px-4 py-3 text-[13px] font-semibold text-[#6B7280] uppercase tracking-[0.03em] sticky top-0 bg-[#F3F4F6]">Code</th>
              <th className="px-4 py-3 text-[13px] font-semibold text-[#6B7280] uppercase tracking-[0.03em] sticky top-0 bg-[#F3F4F6]">Type</th>
              <th className="px-4 py-3 text-[13px] font-semibold text-[#6B7280] uppercase tracking-[0.03em] sticky top-0 bg-[#F3F4F6]">Status</th>
              <th className="px-4 py-3 text-[13px] font-semibold text-[#6B7280] uppercase tracking-[0.03em] sticky top-0 bg-[#F3F4F6]">Manager</th>
              <th className="px-4 py-3 text-[13px] font-semibold text-[#6B7280] uppercase tracking-[0.03em] sticky top-0 bg-[#F3F4F6]">Contact</th>
              <th className="px-4 py-3 text-[13px] font-semibold text-[#6B7280] uppercase tracking-[0.03em] sticky top-0 bg-[#F3F4F6] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F5]">
            {branches.length > 0 ? (
              branches.map((branch) => (
                <tr key={branch._id} className="h-14 hover:bg-[#F8FAFC] transition-colors group">
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#111827] text-[13px]">{branch.name}</span>
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                        {branch.addressLine1 || branch.address || branch.city || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-[12px] font-bold text-gray-600 tracking-tight">{branch.branchCode || "—"}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                      {BRANCH_TYPE_LABELS[branch.branchType] || branch.branchType || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest inline-block ${
                        branch.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : branch.status === "closed"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {branch.status || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">
                      {branch.branchManagerId?.name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-[12px] font-medium text-gray-500 tracking-tight">
                      {branch.phone || branch.managerPhone || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {onToggleStatus && branch.status !== "closed" && (
                        <button
                          onClick={() => onToggleStatus(branch)}
                          className="hover:text-emerald-600"
                        >
                          STATUS
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(branch)}
                        className="hover:text-indigo-600"
                      >
                        EDIT
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-[#6B7280] text-sm">
                  No branches found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BranchTable;

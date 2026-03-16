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
            <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
              <th className="px-6 py-4 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Branch</th>
              <th className="px-6 py-4 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Code</th>
              <th className="px-6 py-4 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Manager</th>
              <th className="px-6 py-4 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F5]">
            {branches.length > 0 ? (
              branches.map((branch) => (
                <tr key={branch._id} className="hover:bg-[#F8FAFC] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                        <FiLayers size={18} strokeWidth={2} />
                      </div>
                      <div>
                        <span className="font-semibold text-[#111827]">{branch.name}</span>
                        <div className="flex items-center text-xs text-[#6B7280] mt-0.5">
                          <FiMapPin className="mr-1 shrink-0" size={12} />
                          {branch.addressLine1 || branch.address || branch.city || "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-[#6B7280]">{branch.branchCode || "—"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-[#6B7280]">
                      {BRANCH_TYPE_LABELS[branch.branchType] || branch.branchType || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        branch.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : branch.status === "closed"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {branch.status ? String(branch.status).charAt(0).toUpperCase() + branch.status.slice(1) : "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                      {branch.branchManagerId?.name ? (
                        <>
                          <FiUser size={14} className="shrink-0" />
                          {branch.branchManagerId.name}
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <FiPhone size={12} className="shrink-0" />
                      {branch.phone || branch.managerPhone || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onToggleStatus && branch.status !== "closed" && (
                        <button
                          onClick={() => onToggleStatus(branch)}
                          className="p-2 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2563EB] transition-colors"
                          title={branch.status === "active" ? "Mark Inactive" : "Mark Active"}
                        >
                          <FiToggleLeft size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(branch)}
                        className="p-2 rounded-lg text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      {onDelete && (
                        <button
                          onClick={() => onDelete(branch._id)}
                          className="p-2 rounded-lg text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-[#6B7280] text-sm">
                  No branches found.
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

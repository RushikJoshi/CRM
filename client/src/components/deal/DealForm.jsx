import React from "react";

/**
 * Deal information form (read-only display). Used on Deal Detail page.
 * Uses consistent input styling with label above.
 */
export default function DealForm({ deal }) {
  if (!deal) return null;

  const stageDisplay =
    deal.stage != null && typeof deal.stage === "string"
      ? deal.stage.replace(/_/g, " ")
      : "—";
  const valueDisplay = Number(deal.value || 0).toLocaleString("en-IN");
  const assignedName = deal.assignedTo?.name || "Unassigned";
  const contactDisplay =
    deal.contactId?.name ||
    deal.leadId?.name ||
    (deal.leadId?.email ? deal.leadId.email : "—");

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Deal Information</h3>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Deal Name</label>
          <input
            type="text"
            readOnly
            value={deal.title || ""}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Value (₹)</label>
          <input
            type="text"
            readOnly
            value={valueDisplay}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Stage</label>
          <input
            type="text"
            readOnly
            value={stageDisplay}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Assigned User</label>
          <input
            type="text"
            readOnly
            value={assignedName}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Contact (optional)</label>
          <input
            type="text"
            readOnly
            value={contactDisplay}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

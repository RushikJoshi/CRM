import React, { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { FiTarget, FiCheckCircle, FiXCircle } from "react-icons/fi";
import LeadPipelineCard from "./LeadPipelineCard";

const formatMoney = (n) => `₹ ${(Number(n || 0) || 0).toLocaleString("en-IN")}`;

const STAGE_LABELS = {
  new_lead: "New Lead",
  attempted_contact: "Attempted Contact",
  contacted: "Contacted",
  qualified: "Qualified",
  prospect: "Prospect",
  won: "Won",
  lost: "Lost",
};

function LeadPipelineColumn({ stageKey, stageLabel, leads, onViewLead }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stageKey,
    data: { type: "stage", stageKey },
  });

  const safeLeads = Array.isArray(leads) ? leads : [];
  const isCompact = safeLeads.length >= 3;
  const totalValue = safeLeads.reduce((sum, l) => sum + (Number(l?.value) || 0), 0);
  const label = stageLabel || STAGE_LABELS[stageKey] || stageKey;
  const isWon = stageKey === "won";
  const isLost = stageKey === "lost";
  const StageIcon = isWon ? FiCheckCircle : isLost ? FiXCircle : FiTarget;
  const stageBadgeColor =
    stageKey === "new_lead"
      ? "bg-blue-100 text-blue-700"
      : stageKey === "attempted_contact"
      ? "bg-amber-100 text-amber-700"
      : stageKey === "contacted"
      ? "bg-indigo-100 text-indigo-700"
      : stageKey === "qualified" || stageKey === "prospect"
      ? "bg-violet-100 text-violet-700"
      : isWon
      ? "bg-emerald-100 text-emerald-700"
      : isLost
      ? "bg-rose-100 text-rose-700"
      : "bg-gray-100 text-gray-700";
  const stageIconColor = isWon ? "text-emerald-500" : isLost ? "text-rose-500" : "text-indigo-500";
  const borderRing = isOver
    ? isWon
      ? "ring-4 ring-emerald-500/20 border-emerald-200"
      : isLost
      ? "ring-4 ring-rose-500/20 border-rose-200"
      : "ring-4 ring-indigo-500/10 border-indigo-200"
    : "";

  return (
    <div className="min-w-[300px] max-w-[300px] snap-start">
      <div
        ref={setNodeRef}
        className={[
          "bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col transition-all duration-200",
          borderRing,
        ].join(" ")}
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-gray-900 text-xs uppercase tracking-wider truncate">{label.replace(/ /g, " ")}</p>
            <span className={`shrink-0 min-w-[24px] h-6 px-2 rounded-lg text-xs font-bold flex items-center justify-center ${stageBadgeColor}`}>
              {safeLeads.length}
            </span>
          </div>
          <p className="mt-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
            {formatMoney(totalValue)}
          </p>
        </div>

        <div className="p-3 bg-gray-50/50 flex-1 min-h-[120px]">
          <SortableContext
            items={(leads || []).filter((l) => l && l._id != null).map((l) => String(l._id))}
            strategy={verticalListSortingStrategy}
          >
            <div className={["flex flex-col min-h-[80px]", isCompact ? "gap-2" : "gap-3"].join(" ")}>
              {safeLeads.length === 0 ? (
                <div className="py-12 text-center bg-white/60 border-2 border-dashed border-gray-200 rounded-xl">
                  <p className="text-gray-400 font-medium text-[10px] uppercase tracking-wider">Drop here</p>
                </div>
              ) : (
                safeLeads
                  .filter((l) => l && l._id != null)
                  .map((lead) => (
                    <LeadPipelineCard
                      key={lead._id}
                      lead={lead}
                      onView={onViewLead}
                      compact={isCompact}
                    />
                  ))
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

export default memo(LeadPipelineColumn);

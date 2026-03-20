import React, { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { FiTarget, FiCheckCircle } from "react-icons/fi";
import LeadPipelineCard from "./LeadPipelineCard";

const formatMoney = (n) => `₹ ${(Number(n || 0) || 0).toLocaleString("en-IN")}`;

const STAGE_LABELS = {
  new: "New",
  qualified: "Qualified",
  proposition: "Proposition",
  won: "Won",
};

function LeadPipelineColumn({ stageKey, stageLabel, leads, onViewLead }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stageKey,
    data: { type: "stage", stageKey },
  });

  const safeLeads = Array.isArray(leads) ? leads : [];
  const isCompact = safeLeads.length >= 3;
  const totalValue = safeLeads.reduce((sum, l) => {
    const v = l?.expectedRevenue ?? l?.value ?? 0;
    return sum + (Number(v) || 0);
  }, 0);
  const label = stageLabel || STAGE_LABELS[stageKey] || stageKey;
  const isWon = stageKey === "won";
  const StageIcon = isWon ? FiCheckCircle : FiTarget;
  const stageBadgeColor =
    stageKey === "new"
      ? "bg-teal-100 text-teal-700"
      : stageKey === "qualified"
      ? "bg-blue-100 text-blue-700"
      : stageKey === "proposition"
      ? "bg-purple-100 text-purple-700"
      : isWon
      ? "bg-emerald-100 text-emerald-700"
      : "bg-gray-100 text-gray-700";
  const stageIconColor =
    stageKey === "new"
      ? "text-teal-600"
      : stageKey === "qualified"
      ? "text-blue-600"
      : stageKey === "proposition"
      ? "text-purple-600"
      : isWon
      ? "text-emerald-600"
      : "text-indigo-500";
  const borderRing = isOver
    ? isWon
      ? "ring-4 ring-emerald-500/20 border-emerald-200"
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
            <div className="flex items-center gap-2 min-w-0">
              <StageIcon size={14} className={["shrink-0", stageIconColor].join(" ")} />
              <p className="font-bold text-gray-900 text-xs uppercase tracking-wider truncate">{label.replace(/ /g, " ")}</p>
            </div>
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

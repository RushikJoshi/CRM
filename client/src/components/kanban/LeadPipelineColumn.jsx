import React, { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { FiTarget, FiZap, FiAward } from "react-icons/fi";
import LeadPipelineCard from "./LeadPipelineCard";

const formatMoney = (n) => `₹ ${(Number(n || 0) || 0).toLocaleString("en-IN")}`;

const STAGE_LABELS = {
  new: "New",
  qualified: "Qualified",
  proposition: "Proposal",
  won: "Won",
};

function LeadPipelineColumn({ stageKey, stageLabel, leads, onViewLead }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stageKey,
    data: { type: "stage", stageKey },
  });

  const safeLeads = Array.isArray(leads) ? leads : [];
  const totalValue = safeLeads.reduce((sum, l) => {
    const v = l?.expectedRevenue ?? l?.value ?? 0;
    return sum + (Number(v) || 0);
  }, 0);
  const label = stageLabel || STAGE_LABELS[stageKey] || stageKey;
  const isWon = stageKey.toLowerCase() === "won";
  
  const StageIcon = isWon ? FiAward : (stageKey.toLowerCase() === "proposition" ? FiZap : FiTarget);

  return (
    <div className="flex-1 min-w-[240px] max-w-[320px] h-full flex flex-col">
      <div
        ref={setNodeRef}
        className={`
          flex-1 bg-[var(--surface2)] border border-[var(--border)] rounded-[var(--r-md)] flex flex-col transition-all duration-200
          ${isOver ? "bg-[var(--indigo-l)] border-[var(--indigo-b)] ring-4 ring-[rgba(99,102,241,.05)] scale-[0.99]" : ""}
        `}
      >
        <div className="p-2.5 border-b border-[var(--border)] bg-white rounded-t-[var(--r-md)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isWon ? "bg-emerald-50 text-emerald-600" : "bg-[var(--indigo-l)] text-[var(--indigo)]"}`}>
                <StageIcon size={14} />
              </div>
              <h3 className="text-[12px] font-bold text-[var(--txt)] uppercase tracking-wider truncate">{label}</h3>
            </div>
            <span className={`shrink-0 min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-bold flex items-center justify-center bg-[var(--surface2)] border border-[var(--border)] text-[var(--txt2)]`}>
              {safeLeads.length}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-bold text-[var(--txt3)]">
            {formatMoney(totalValue)}
          </p>
        </div>

        <div className="p-2 gap-2 flex flex-col overflow-y-auto custom-scrollbar flex-1 min-h-[400px]">
          <SortableContext
            items={(leads || []).filter((l) => l && l._id != null).map((l) => String(l._id))}
            strategy={verticalListSortingStrategy}
          >
            {safeLeads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] rounded-[var(--r)] opacity-30 select-none m-2 py-10">
                  <p className="text-[var(--txt4)] font-bold uppercase tracking-widest text-[9px]">Drop Here</p>
                </div>
              ) : (
                safeLeads
                  .filter((l) => l && l._id != null)
                  .map((lead) => (
                    <LeadPipelineCard
                      key={lead._id}
                      lead={lead}
                      onView={onViewLead}
                    />
                  ))
              )}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

export default memo(LeadPipelineColumn);

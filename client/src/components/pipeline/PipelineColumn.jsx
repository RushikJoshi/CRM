import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import DealCard from "./DealCard";

/**
 * Single pipeline column: stage name, deal count, total value, droppable card list.
 * Uses Gitakshmi design system tokens.
 */
export default function PipelineColumn({
  stageId,
  stageLabel,
  color,
  probability,
  deals,
  onEdit,
  onAddTask,
  onViewDeal,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stageId,
    data: { type: "stage", stageId },
  });

  const totalValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const count = deals.length;

  return (
    <div className="flex-shrink-0 w-[280px] flex flex-col gap-3">
      <div className="bg-white rounded-[var(--r-md)] shadow-[var(--sh-sm)] border border-[var(--border2)] overflow-hidden">
        <div className="h-1" style={{ backgroundColor: color || "var(--indigo)" }} />
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[13px] font-bold text-[var(--txt)] truncate">{stageLabel}</h3>
                    {probability !== undefined && (
                        <span className="text-[10px] font-bold text-[var(--indigo)] bg-[var(--indigo-l)] px-1.5 py-0.5 rounded-full border border-[var(--indigo-b)]">
                            {probability}%
                        </span>
                    )}
                </div>
                <p className="text-[10px] font-bold text-[var(--txt4)] uppercase tracking-wider">
                    {count} {count === 1 ? 'DEAL' : 'DEALS'}
                </p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-[13px] font-bold text-[var(--indigo)]">
                    ₹{totalValue.toLocaleString("en-IN")}
                </p>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-[400px] rounded-[var(--r-md)] border-2 border-dashed transition-all duration-200 p-2.5
          ${isOver ? "bg-[var(--indigo-l)] border-[var(--indigo-b)] scale-[0.99]" : "bg-[var(--surface2)] border-[var(--border)]"}
        `}
      >
        <SortableContext
          items={deals.map((d) => d._id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.length > 0 ? (
            deals.map((deal) => (
              <DealCard
                key={deal._id}
                deal={deal}
                onView={onViewDeal}
                onEdit={onEdit}
                onAddTask={onAddTask}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 select-none">
              <div className="text-[var(--txt4)] font-bold uppercase tracking-wider text-[11px]">Drop Deals Here</div>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

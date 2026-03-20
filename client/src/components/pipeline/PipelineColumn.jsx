import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import DealCard from "./DealCard";

/**
 * Single pipeline column: stage name, deal count, total value, droppable card list.
 * Uses gray/indigo only. No sky/emerald.
 */
export default function PipelineColumn({
  stageId,
  stageLabel,
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{stageLabel}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {count} deal{count !== 1 ? "s" : ""}
            </p>
          </div>
          <p className="text-sm font-medium text-indigo-600">
            ₹{totalValue.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-[320px] rounded-xl border-2 border-dashed border-gray-200 p-3
          transition-colors
          ${isOver ? "bg-indigo-50/50 border-indigo-300" : "bg-gray-50/50"}
        `}
      >
        <SortableContext
          items={deals.map((d) => d._id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <DealCard
              key={deal._id}
              deal={deal}
              onView={onViewDeal}
              onEdit={onEdit}
              onAddTask={onAddTask}
            />
          ))}
          {deals.length === 0 && (
            <div className="flex items-center justify-center min-h-[200px] text-gray-400 text-sm">
              No deals
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

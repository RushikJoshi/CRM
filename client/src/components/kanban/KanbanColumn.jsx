import React, { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { FiTarget } from "react-icons/fi";
import KanbanCard from "./KanbanCard";

const formatMoney = (n) => `₹ ${(Number(n || 0) || 0).toLocaleString("en-IN")}`;

function KanbanColumn({ stage, deals }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage._id,
    data: { type: "stage", stage },
  });

  const totalValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  return (
    <div className="min-w-[320px] max-w-[320px] snap-start">
      <div
        ref={setNodeRef}
        className={[
          "bg-white/70 dark:bg-slate-950/40",
          "border border-gray-100 dark:border-slate-800",
          "rounded-3xl shadow-sm",
          "flex flex-col",
          "transition-all duration-200",
          isOver ? "ring-4 ring-blue-500/10 border-blue-200 dark:border-blue-500/30" : "",
        ].join(" ")}
      >
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-black text-gray-900 dark:text-slate-50 text-sm uppercase tracking-widest flex items-center gap-2">
                <FiTarget size={16} className="text-blue-500" />
                <span className="truncate">{stage.name}</span>
              </p>
              <p className="mt-2 text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">
                {deals.length} deals • {formatMoney(totalValue)}
              </p>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-[10px] font-black text-gray-400 dark:text-slate-400">
              {Math.round(stage.probability || 0)}%
            </span>
          </div>
        </div>

        <div className="p-4 bg-gray-50/30 dark:bg-slate-950/20 flex-1">
          <SortableContext items={deals.map((d) => d._id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3 min-h-[80px]">
              {deals.length === 0 ? (
                <div className="py-14 text-center bg-white/40 dark:bg-slate-900/30 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl">
                  <p className="text-gray-300 dark:text-slate-600 font-black uppercase tracking-widest text-[10px]">Drop here</p>
                </div>
              ) : (
                deals.map((deal) => <KanbanCard key={deal._id} deal={deal} />)
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

export default memo(KanbanColumn);


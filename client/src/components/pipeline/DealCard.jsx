import React from "react";
import { FiMenu, FiCalendar, FiPlusSquare } from "react-icons/fi";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Small deal card for Kanban. bg-white, rounded-xl, shadow-sm, p-3.
 * Shows: deal name, company/contact, value, assigned user (avatar).
 */
export default function DealCard({ deal, onView, onEdit, onAddTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal._id,
    data: { type: "deal", deal },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const companyOrContact =
    deal.companyId?.name ||
    deal.leadId?.companyName ||
    deal.leadId?.name ||
    deal.contactId?.name ||
    "—";
  const value = Number(deal.value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
  const assignedName = deal.assignedUser?.name || deal.assignedTo?.name || "Unassigned";
  const initials = (assignedName || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-3 ${isDragging ? "opacity-60 z-10" : "group/card"}`}
    >
      <div
        className={`
          bg-white rounded-[var(--r-md)] border border-[var(--border2)] p-3
          hover:shadow-[var(--sh-md)] hover:border-[var(--indigo-b)] transition-all cursor-pointer
          ${isDragging ? "shadow-lg ring-2 ring-[var(--indigo-l)]" : "shadow-[var(--sh-sm)]"}
        `}
        onClick={() => onView?.(deal)}
      >
        <div className="flex items-start gap-2">
            <div
                {...attributes}
                {...listeners}
                className="shrink-0 mt-0.5 p-1 rounded-md text-[var(--txt4)] hover:text-[var(--indigo)] hover:bg-[var(--indigo-l)] cursor-grab active:cursor-grabbing touch-none transition-colors"
                onClick={(e) => e.stopPropagation()}
            >
                <FiMenu size={14} />
            </div>
          
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-[13px] font-bold text-[var(--txt)] truncate leading-tight group-hover/card:text-[var(--indigo)] transition-colors">
                        {deal.customId || deal.title || "Untitled Deal"}

                    </h4>
                </div>
                
                <p className="text-[11.5px] text-[var(--txt3)] truncate mb-3">
                    {companyOrContact}
                </p>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--border)]">
                    <span className="text-[12px] font-bold text-[var(--txt2)]">
                        {value}
                    </span>
                    
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--indigo)] to-[var(--indigo-light)] flex items-center justify-center text-white text-[9px] font-bold shadow-sm" title={assignedName}>
                            {initials}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { FiMenu } from "react-icons/fi";
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
  const value = Number(deal.value || 0).toLocaleString("en-IN");
  const assignedName = deal.assignedTo?.name || "Unassigned";
  const initial = (assignedName || "U").charAt(0).toUpperCase();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-3 ${isDragging ? "opacity-60 z-10" : ""}`}
    >
      <div
        className={`
          bg-white rounded-xl shadow-sm p-3 border border-gray-200
          hover:shadow-md transition-shadow
          ${isDragging ? "shadow-lg ring-2 ring-indigo-200" : ""}
        `}
        onClick={onView ? () => onView(deal) : undefined}
        onKeyDown={onView ? (e) => e.key === "Enter" && onView(deal) : undefined}
        role={onView ? "button" : "article"}
        tabIndex={onView ? 0 : undefined}
      >
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="shrink-0 mt-0.5 p-1 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
            aria-label="Drag to move"
          >
            <FiMenu size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-800 truncate leading-tight">
              {deal.title || "Untitled"}
            </h4>
            <p className="text-xs text-gray-500 truncate mt-0.5">{companyOrContact}</p>
            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-medium text-indigo-600">₹{value}</span>
              <div
                className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600 shrink-0"
                title={assignedName}
              >
                {initial}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

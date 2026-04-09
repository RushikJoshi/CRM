import React, { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiMenu, FiCalendar } from "react-icons/fi";

const formatDateTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

function LeadPipelineCard({ lead, isOverlay = false, onView }) {
  const isValidLead = Boolean(lead && lead._id != null);
  const safeLead = isValidLead
    ? lead
    : { _id: "__invalid__", name: "", stageUpdatedAt: null, updatedAt: null, createdAt: null };
  const id = String(safeLead._id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: "lead", lead: safeLead },
    disabled: !isValidLead || isOverlay,
  });

  if (!isValidLead) return null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const title = lead?.name || "Untitled Lead";
  const lastActivity = formatDateTime(lead?.stageUpdatedAt || lead?.updatedAt || lead?.createdAt);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white border border-[var(--border)] rounded-[var(--r)] px-2 py-1.5 select-none transition-all
        ${isOverlay ? "shadow-[var(--sh-lg)] ring-1 ring-[var(--indigo)]" : "shadow-[var(--sh-sm)] hover:border-[var(--indigo-b)]"}
        ${isDragging && !isOverlay ? "opacity-30 scale-95" : ""}
      `}
      onClick={() => !isOverlay && onView?.(lead)}
    >
      <div className="flex items-center gap-2">
        {!isOverlay && (
          <div
            {...attributes}
            {...listeners}
            className="shrink-0 p-1 rounded hover:text-[var(--indigo)] hover:bg-[var(--indigo-l)] cursor-grab active:cursor-grabbing text-[var(--txt4)]"
          >
            <FiMenu size={12} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-[12px] font-bold text-[var(--txt)] truncate leading-tight">
            {title}
          </h4>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold text-[var(--txt4)] bg-[var(--surface2)] px-1.5 py-0.5 rounded border border-[var(--border2)]">
          <FiCalendar size={9} />
          <span>{lastActivity}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(LeadPipelineCard);

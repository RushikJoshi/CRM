import React, { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { FiClock, FiFlag, FiMail, FiPhone, FiActivity, FiMenu } from "react-icons/fi";

const formatMoney = (v) => {
  const n = Number(v || 0);
  if (Number.isNaN(n)) return "₹ 0";
  return `₹ ${n.toLocaleString("en-IN")}`;
};

const formatDateTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

const clampStars = (n) => {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(3, Math.round(v)));
};

const Stars = ({ value }) => {
  const v = clampStars(value);
  return (
    <span className="text-[11px] font-black tracking-widest text-amber-500">
      {"★".repeat(v)}
      <span className="text-gray-200">{"★".repeat(3 - v)}</span>
    </span>
  );
};

function LeadPipelineCard({ lead, isOverlay = false, onView, compact = false }) {
  if (!lead || lead._id == null) return null;
  const id = String(lead._id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: "lead", lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const title = lead?.name || "Untitled lead";
  const ownerName = lead?.assignedTo?.name || "Unassigned";
  const source = lead?.source || "—";
  const lastActivity = formatDateTime(lead?.stageUpdatedAt || lead?.updatedAt || lead?.createdAt);
  const expectedRevenue = lead?.expectedRevenue ?? lead?.value ?? 0;
  const priorityStars = lead?.priorityStars ?? 0;
  const isWon = lead?.stage === "won";

  const showCompact = compact && !isOverlay;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={false}
      whileHover={isOverlay ? undefined : { y: -2 }}
      className={[
        "select-none",
        "bg-white dark:bg-slate-900",
        "border border-gray-100 dark:border-slate-800",
        showCompact ? "rounded-xl px-3 py-2.5 shadow-sm" : "rounded-2xl p-4 shadow-sm",
        "transition-shadow",
        isOverlay ? "shadow-2xl" : "hover:shadow-md",
        isWon ? "ring-2 ring-emerald-500/20 border-emerald-200" : "",
        isDragging && !isOverlay ? "opacity-40" : "",
      ].join(" ")}
      role="article"
    >
      <div className={["flex items-start gap-2", showCompact ? "gap-2" : ""].join(" ")}>
        {!isOverlay && (
          <div
            {...attributes}
            {...listeners}
            className={[
              "shrink-0 mt-0.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing touch-none",
              showCompact ? "p-1" : "p-1.5",
            ].join(" ")}
            aria-label="Drag to move"
          >
            <FiMenu size={16} />
          </div>
        )}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={!isOverlay && onView ? () => onView(lead) : undefined}
          onKeyDown={!isOverlay && onView ? (e) => e.key === "Enter" && onView(lead) : undefined}
          role={onView ? "button" : undefined}
          tabIndex={onView ? 0 : undefined}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={["font-black text-gray-900 dark:text-slate-50 truncate", showCompact ? "text-[13px]" : "text-sm"].join(" ")}>
                {title}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className={showCompact ? "text-[10px] font-black text-gray-400 uppercase tracking-widest" : "text-[10px] font-black text-gray-400 uppercase tracking-widest"}>
                  {formatMoney(expectedRevenue)}
                </span>
                <Stars value={priorityStars} />
              </div>
            </div>
            <div
              className={[
                "shrink-0 bg-slate-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-300 font-black",
                showCompact ? "w-8 h-8 rounded-xl text-xs" : "w-9 h-9 rounded-2xl",
              ].join(" ")}
              title={ownerName}
            >
              {(ownerName || "U").charAt(0).toUpperCase()}
            </div>
          </div>

          <div className={showCompact ? "mt-2 flex items-center justify-between gap-2" : "mt-4 flex flex-wrap items-center gap-2"}>
            <div className={showCompact ? "flex items-center gap-2 min-w-0" : "contents"}>
              <span className={showCompact
                ? "px-2 py-0.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-[10px] font-black text-gray-600 dark:text-slate-300 uppercase tracking-widest truncate max-w-[160px]"
                : "px-3 py-1 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-[10px] font-black text-gray-500 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2"
              }>
                <FiFlag size={12} className="text-gray-300 dark:text-slate-500" />
                {source}
              </span>
            </div>
            {showCompact && (
              <span className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap" title={lastActivity}>
                <FiClock size={12} className="inline -mt-0.5 mr-1 text-gray-300 dark:text-slate-500" />
                {lastActivity}
              </span>
            )}
          </div>

          {!showCompact && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest" title={lastActivity}>
                <FiClock size={12} className="inline -mt-0.5 mr-1 text-gray-300" />
                {lastActivity}
              </span>
              <div className="flex items-center gap-2 text-gray-400">
                <FiPhone size={14} title={lead?.phone || "Phone"} />
                <FiMail size={14} title={lead?.email || "Email"} />
                <FiActivity size={14} title="Activity" />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default memo(LeadPipelineCard);

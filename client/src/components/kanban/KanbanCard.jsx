import React, { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { FiBriefcase, FiClock, FiFlag, FiUser } from "react-icons/fi";

const priorityStyles = {
  high: "border-l-4 border-l-rose-500",
  medium: "border-l-4 border-l-amber-400",
  low: "border-l-4 border-l-emerald-500",
};

const getPriority = (deal) => {
  const p = (deal?.leadId?.priority || deal?.priority || "medium").toString().toLowerCase();
  if (p === "high" || p === "medium" || p === "low") return p;
  return "medium";
};

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

function KanbanCard({ deal, isOverlay = false }) {
  const id = deal?._id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: "deal", deal } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const title = deal?.title || deal?.leadId?.name || "Untitled deal";
  const companyName = deal?.leadId?.companyName || deal?.customerId?.name || "—";
  const ownerName = deal?.assignedTo?.name || "Unassigned";
  const leadSource = deal?.leadId?.source || "—";
  const lastActivity = formatDateTime(deal?.updatedAt || deal?.createdAt);
  const priority = getPriority(deal);

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
        "rounded-2xl p-4 shadow-sm",
        "transition-shadow",
        isOverlay ? "shadow-2xl" : "hover:shadow-md",
        priorityStyles[priority],
        isDragging && !isOverlay ? "opacity-40" : "",
      ].join(" ")}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-gray-900 dark:text-slate-50 text-sm truncate">{title}</p>
          <p className="mt-1 text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest truncate">
            {companyName}
          </p>
        </div>
        <div className="shrink-0 w-9 h-9 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-300 font-black">
          {(ownerName || "U").charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="px-3 py-1 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-[10px] font-black text-gray-500 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
          <FiBriefcase size={12} />
          {formatMoney(deal?.value)}
        </span>
        <span className="px-3 py-1 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-[10px] font-black text-gray-500 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
          <FiFlag size={12} />
          {leadSource}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="px-3 py-2 rounded-2xl bg-gray-50/60 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700">
          <p className="text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Owner</p>
          <p className="mt-1 text-xs font-black text-gray-900 dark:text-slate-50 truncate flex items-center gap-2">
            <FiUser size={12} className="text-gray-300 dark:text-slate-500" />
            {ownerName}
          </p>
        </div>
        <div className="px-3 py-2 rounded-2xl bg-gray-50/60 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700">
          <p className="text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Last activity</p>
          <p className="mt-1 text-xs font-black text-gray-900 dark:text-slate-50 truncate flex items-center gap-2">
            <FiClock size={12} className="text-gray-300 dark:text-slate-500" />
            {lastActivity}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(KanbanCard);


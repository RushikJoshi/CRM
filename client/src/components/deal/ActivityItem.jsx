import React from "react";
import { FiPhone, FiCalendar, FiFileText, FiMail, FiMessageSquare, FiInfo } from "react-icons/fi";

const TYPE_CONFIG = {
  call: { icon: FiPhone, label: "Call", color: "bg-gray-100 text-gray-700 border-gray-200" },
  meeting: { icon: FiCalendar, label: "Meeting", color: "bg-teal-50 text-teal-700 border-teal-200" },
  note: { icon: FiFileText, label: "Note", color: "bg-gray-100 text-gray-700 border-gray-200" },
  email: { icon: FiMail, label: "Email", color: "bg-gray-100 text-gray-700 border-gray-200" },
  message: { icon: FiMessageSquare, label: "Message", color: "bg-gray-100 text-gray-700 border-gray-200" },
  deal_stage_changed: { icon: FiInfo, label: "Stage", color: "bg-teal-50 text-teal-700 border-teal-200" },
  task: { icon: FiFileText, label: "Task", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

const NEXT_FOLLOW_UP_REGEX = /Next follow-up:\s*(\d{4}-\d{2}-\d{2})/i;

function parseNoteAndFollowUp(note) {
  if (!note || typeof note !== "string") return { note: note || "", followUpDate: null };
  const match = note.match(NEXT_FOLLOW_UP_REGEX);
  const followUpDate = match ? match[1] : null;
  const noteText = match ? note.replace(NEXT_FOLLOW_UP_REGEX, "").trim().replace(/\s*\.\s*$/, "") : note;
  return { noteText, followUpDate };
}

function FollowUpBadge({ dateStr }) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUp = new Date(d);
  followUp.setHours(0, 0, 0, 0);
  const isOverdue = followUp < today;
  const isToday = followUp.getTime() === today.getTime();
  const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const bg = isOverdue ? "bg-red-100 text-red-700" : isToday ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${bg}`}>
      Next follow-up: {label}
      {isOverdue && " (Overdue)"}
      {isToday && " (Today)"}
    </span>
  );
}

export default function ActivityItem({ activity }) {
  if (!activity) return null;
  const config = TYPE_CONFIG[activity.type] || { icon: FiInfo, label: activity.type || "Activity", color: "bg-gray-100 text-gray-600 border-gray-200" };
  const Icon = config.icon;
  const date = activity.date ? new Date(activity.date) : null;
  const dateStr = date && !Number.isNaN(date.getTime())
    ? date.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";
  const { noteText, followUpDate } = parseNoteAndFollowUp(activity.title ?? activity.note);

  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${config.color}`}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-gray-500">{config.label}</span>
          <span className="text-xs text-gray-400 shrink-0">{dateStr}</span>
        </div>
        <p className="text-sm text-gray-800 mt-0.5 break-words">{noteText || "—"}</p>
        <FollowUpBadge dateStr={followUpDate} />
        {activity.user && (
          <p className="text-xs text-gray-400 mt-1">{activity.user}</p>
        )}
      </div>
    </div>
  );
}

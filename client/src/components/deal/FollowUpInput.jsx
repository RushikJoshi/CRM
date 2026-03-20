import React, { useState } from "react";
import { FiPlus } from "react-icons/fi";
import API from "../../services/api";

const ACTIVITY_TYPES = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
];

/**
 * Form to add an activity with optional next follow-up date.
 * Appends "Next follow-up: YYYY-MM-DD" to the note when date is set (for display/parsing in ActivityItem).
 */
export default function FollowUpInput({ dealId, onAdded }) {
  const [type, setType] = useState("note");
  const [note, setNote] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = (note || "").trim();
    if (!trimmed || !dealId) return;
    setSaving(true);
    try {
      const noteText = nextFollowUpDate
        ? `${trimmed}. Next follow-up: ${nextFollowUpDate}`
        : trimmed;
      await API.post("/activities", {
        dealId,
        type,
        note: noteText,
      });
      setNote("");
      setNextFollowUpDate("");
      onAdded?.();
    } catch (err) {
      console.error("Add activity error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Activity type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 text-sm"
        >
          {ACTIVITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          rows={3}
          required
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 text-sm placeholder-gray-400 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Next follow-up date (optional)</label>
        <input
          type="date"
          value={nextFollowUpDate}
          onChange={(e) => setNextFollowUpDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !note.trim()}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiPlus size={14} />
        {saving ? "Saving..." : "Add Activity"}
      </button>
    </form>
  );
}

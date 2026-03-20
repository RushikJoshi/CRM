import React, { useMemo, useState } from "react";
import { FiX } from "react-icons/fi";

const DEFAULT_REASONS = ["Price too high", "Chose competitor", "No budget", "No response", "Other"];

export default function LostModal({ isOpen, onClose, onConfirm, loading = false }) {
  const reasons = useMemo(() => DEFAULT_REASONS, []);
  const [reason, setReason] = useState(reasons[0]);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="min-w-0">
            <h3 className="font-black text-slate-900">Mark as Lost</h3>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">Reason for losing?</p>
          </div>
          <button
            type="button"
            onClick={loading ? undefined : onClose}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white disabled:bg-slate-50"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={4}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white disabled:bg-slate-50 resize-none"
              placeholder="Add extra details…"
            />
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-black text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.({ reason, notes })}
            disabled={loading}
            className="flex-1 py-3 border border-rose-200 text-rose-700 bg-rose-50 rounded-xl font-black text-sm hover:bg-rose-100 transition-all disabled:opacity-50"
          >
            {loading ? "Saving..." : "Mark Lost"}
          </button>
        </div>
      </div>
    </div>
  );
}


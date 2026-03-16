import React from "react";
import { FiX, FiCheckCircle, FiUser, FiBriefcase } from "react-icons/fi";

/**
 * Shown when a lead is dropped on the "Won" column.
 * Options: Convert to Deal & Customer | Just mark as Won | Cancel
 */
const ConvertLeadModal = ({ isOpen, onClose, lead, onConvert, onJustMarkWon, loading }) => {
  if (!isOpen || !lead) return null;

  const name = lead?.name || "This lead";
  const companyName = lead?.companyName || "—";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={!loading ? onClose : undefined}
        aria-hidden
      />
      <div className="relative z-10 bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 dark:text-slate-50 tracking-tight">
            Lead moved to Won
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FiUser size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-gray-900 dark:text-slate-50 truncate">{name}</p>
              <p className="text-sm font-bold text-gray-500 dark:text-slate-400 truncate">{companyName}</p>
            </div>
          </div>

          <p className="text-sm font-bold text-gray-600 dark:text-slate-300">
            Do you want to create a Deal and Customer from this lead, or only mark it as won?
          </p>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={() => onConvert(lead)}
              disabled={loading || lead?.isConverted}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black rounded-xl text-sm uppercase tracking-wider transition-colors"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiBriefcase size={18} />
                  {lead?.isConverted ? "Already converted" : "Convert to Deal & Customer"}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onJustMarkWon(lead)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-black rounded-xl text-sm uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              <FiCheckCircle size={18} />
              Just mark as Won
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full px-4 py-3 text-gray-500 dark:text-slate-400 font-bold text-sm hover:text-gray-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConvertLeadModal;

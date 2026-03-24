import React, { useMemo, useState } from "react";
import { FiX, FiArrowRight, FiTrendingUp, FiBriefcase, FiCheckCircle } from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";

export default function ConvertLeadWizard({ isOpen, onClose, lead, onConverted }) {
  const toast = useToast();
  const [mode, setMode] = useState("prospect"); // "prospect" | "deal"
  const [loading, setLoading] = useState(false);

  const leadId = lead?._id;
  const name = lead?.name || "Lead";
  const companyName = lead?.companyName || "Individual";
  const canConvert = Boolean(leadId) && !lead?.isConverted;

  const summary = useMemo(
    () => [
      { label: "Email", value: lead?.email || "—" },
      { label: "Phone", value: lead?.phone || "—" },
      { label: "Source", value: lead?.source || lead?.sourceId?.name || "—" },
      { label: "Value", value: `₹${Number(lead?.value || 0).toLocaleString("en-IN")}` },
      { label: "Stage", value: (lead?.stage || "—").toString().replace(/_/g, " ") },
    ],
    [lead]
  );

  const handleSubmit = async () => {
    if (!canConvert) return;
    setLoading(true);
    try {
      if (mode === "prospect") {
        await API.patch(`/leads/${leadId}/stage`, { status: "prospect" });
        toast.success("Lead moved to Prospect.");
        onConverted?.({ type: "prospect" });
        onClose?.();
        return;
      }

      const res = await API.post(`/leads/${leadId}/convert`);
      const dealTitle = res.data?.data?.deal?.title;
      toast.success(dealTitle ? `Converted to Deal: ${dealTitle}` : "Lead converted successfully.");
      onConverted?.({ type: "deal", data: res.data?.data });
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Conversion failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Convert</p>
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {name} <span className="text-gray-400 font-medium">· {companyName}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
          {/* Left: Summary */}
          <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-gray-100 p-5 bg-gray-50/40">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Lead summary</p>
            <div className="space-y-3">
              {summary.map((r) => (
                <div key={r.label}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{r.label}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5 break-words">{r.value}</p>
                </div>
              ))}
            </div>
            {lead?.isConverted && (
              <div className="mt-4 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium flex items-center gap-2">
                <FiCheckCircle size={16} /> Already converted
              </div>
            )}
          </div>

          {/* Right: Choose type */}
          <div className="md:col-span-3 p-5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Choose conversion</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setMode("prospect")}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  mode === "prospect"
                    ? "border-teal-200 bg-teal-50/60"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
                      <FiTrendingUp size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Convert to Prospect</p>
                      <p className="text-xs text-gray-500 mt-0.5">Move lead into Prospect stage (no record creation).</p>
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("deal")}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  mode === "deal"
                    ? "border-teal-200 bg-teal-50/60"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
                      <FiBriefcase size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Convert to Deal + Account</p>
                      <p className="text-xs text-gray-500 mt-0.5">Create Deal, Account and Contact from this lead.</p>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canConvert || loading}
                className="px-4 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiArrowRight size={16} />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


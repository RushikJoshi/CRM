import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const buildPages = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, 2, totalPages - 1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const filtered = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < filtered.length; i++) {
    const p = filtered[i];
    const prev = filtered[i - 1];
    if (i > 0 && prev != null && p - prev > 1) out.push("…");
    out.push(p);
  }
  return out;
};

const Pagination = ({ currentPage, totalPages, onPageChange, total, pageSize = 10 }) => {
  if (!totalPages || total === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total ?? currentPage * pageSize);
  const pages = buildPages(currentPage, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 bg-white rounded-xl border border-[#E0F2FE] shadow-crm-soft">
      <div className="text-xs font-medium text-[#64748B]">
        {total != null && total > 0 ? (
          <>Showing {start}–{end} of {total}</>
        ) : (
          <>Page {currentPage} of {totalPages}</>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="px-3 h-10 inline-flex items-center gap-2 rounded-[10px] border border-[#E0F2FE] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-[#E0F7FF] text-[#64748B] hover:text-[#0F172A]"
          aria-label="Previous page"
        >
          <span className="text-sm font-bold">Prev</span>
        </button>
        <div className="flex items-center gap-1.5">
          {pages.map((p, idx) =>
            p === "…" ? (
              <span key={`ellipsis-${idx}`} className="min-w-[2.5rem] h-10 inline-flex items-center justify-center text-sm text-[#94A3B8]">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[2.5rem] h-10 rounded-[10px] text-sm font-semibold transition-all border ${
                  currentPage === p
                    ? "bg-[#38BDF8] text-white border-[#38BDF8] shadow-sm"
                    : "bg-white text-[#0F172A] border-[#E0F2FE] hover:bg-[#E0F7FF]"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="px-3 h-10 inline-flex items-center gap-2 rounded-[10px] border border-[#E0F2FE] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-[#E0F7FF] text-[#64748B] hover:text-[#0F172A]"
          aria-label="Next page"
        >
          <span className="text-sm font-bold">Next</span>
        </button>
      </div>
    </div>
  );
};

export default Pagination;

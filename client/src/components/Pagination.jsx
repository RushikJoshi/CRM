import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/**
 * Reusable pagination for list pages.
 * @param {number} currentPage - 1-based current page
 * @param {number} totalPages - total pages
 * @param {function} onPageChange - (page: number) => void
 * @param {number} [total] - optional total count for "Showing X–Y of Z"
 * @param {number} [pageSize] - items per page (for range display)
 */
const Pagination = ({ currentPage, totalPages, onPageChange, total, pageSize = 10 }) => {
  if (!totalPages || totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total ?? currentPage * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
      <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
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
          className="p-2.5 rounded-lg border border-[#E5E7EB] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-[#F8FAFC] text-[#6B7280] hover:text-[#111827]"
          aria-label="Previous page"
        >
          <FiChevronLeft size={20} />
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[2.5rem] h-10 rounded-lg text-sm font-semibold transition-all ${
                  currentPage === pageNum
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "text-[#6B7280] hover:bg-[#F8FAFC] hover:text-[#111827]"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="p-2.5 rounded-lg border border-[#E5E7EB] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-[#F8FAFC] text-[#6B7280] hover:text-[#111827]"
          aria-label="Next page"
        >
          <FiChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

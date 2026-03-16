import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch, FiArrowUpRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const groupByType = (items) => {
  const map = new Map();
  for (const it of items) {
    const key = it.type || "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  }
  return Array.from(map.entries());
};

export default function GlobalSearch({ className = "", placeholder = "Search leads, deals, contacts, customers..." }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(false);
  const lastReq = useRef(0);

  const grouped = useMemo(() => groupByType(items), [items]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setItems([]);
      setOpen(false);
      setError(false);
      return;
    }

    const reqId = ++lastReq.current;
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await API.get(`/search?query=${encodeURIComponent(query.trim())}`);
        if (reqId !== lastReq.current) return;
        setItems(res.data?.data || []);
        setOpen(true);
      } catch (e) {
        if (reqId !== lastReq.current) return;
        setError(true);
        setItems([]);
        setOpen(true);
      } finally {
        if (reqId === lastReq.current) setLoading(false);
      }
    }, 220);

    return () => clearTimeout(t);
  }, [query]);

  const onPick = (it) => {
    setOpen(false);
    setQuery("");
    // server gives link without role prefix; keep it safe by navigating to module root
    navigate(it.link || "/dashboard");
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center bg-[#F8FAFC] px-4 py-2.5 rounded-lg w-full focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:bg-white border border-[#E5E7EB] transition-all group">
        <FiSearch className="text-[#6B7280] shrink-0 group-focus-within:text-[#2563EB] transition-colors" size={18} />
        <input
          type="text"
          placeholder={placeholder}
          className="bg-transparent border-none outline-none ml-3 text-sm w-full font-medium text-[#111827] placeholder-[#6B7280]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
        />
        {loading && <div className="w-4 h-4 border-2 border-[#E5E7EB] border-t-[#2563EB] rounded-full animate-spin" />}
      </div>

      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-[#E5E7EB] overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
            <span className="text-xs font-medium text-[#6B7280]">Results</span>
            <span className="text-xs font-semibold text-[#2563EB]">{items.length}</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {error ? (
              <div className="p-8 text-center text-sm text-[#6B7280]">Search failed. Try again.</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#6B7280]">No matches</div>
            ) : (
              <div className="p-2">
                {grouped.map(([type, rows]) => (
                  <div key={type} className="mb-2">
                    <p className="px-3 py-1.5 text-xs font-medium text-[#6B7280] uppercase tracking-wider">{type}</p>
                    {rows.map((it) => (
                      <button
                        type="button"
                        key={it.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onPick(it)}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111827] truncate">{it.name}</p>
                          <p className="text-xs text-[#6B7280] mt-0.5">{it.type}</p>
                        </div>
                        <FiArrowUpRight className="text-[#E5E7EB] hover:text-[#2563EB] shrink-0" size={16} />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


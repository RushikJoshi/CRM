import React from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`p-3 rounded-2xl transition-all relative ${
        isDark
          ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
          : "text-[#718096] hover:bg-slate-50 hover:text-[#1A202C]"
      } ${className}`}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      type="button"
    >
      {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
    </button>
  );
}


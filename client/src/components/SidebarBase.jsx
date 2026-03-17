import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiGrid } from "react-icons/fi";

/**
 * SaaS sidebar (Sky theme). UI only – no logic changes.
 */
const SidebarBase = ({
  menuItems,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  onLogout,
  logoLabel = "Horizon CRM",
  logoIcon = null,
}) => {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[60] lg:hidden transition-opacity duration-200"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 z-[70] h-full flex flex-col
          bg-[#E0F2FE]/60 backdrop-blur-sm border-r border-[#E0F2FE]
          transition-all duration-300 ease-out
          ${isCollapsed ? "w-sidebar-collapsed" : "w-sidebar"}
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className={`shrink-0 border-b border-[#E0F2FE] ${isCollapsed ? "px-0 py-5" : "px-4 py-5"}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
            {logoIcon || (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#38BDF8] to-[#0EA5E9] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#0EA5E9]/20">
                <FiGrid size={18} strokeWidth={2.5} />
              </div>
            )}
            {!isCollapsed && (
              <span className="font-semibold text-[#0F172A] text-sm truncate">
                {logoLabel}
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (location.pathname.startsWith(item.path + "/"));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px]
                  transition-colors duration-150
                  ${isActive
                    ? "bg-white/80 text-[#0284C7] font-semibold shadow-sm"
                    : "text-[#64748B] hover:bg-white/60 hover:text-[#0F172A] font-medium"
                  }
                  ${isCollapsed ? "justify-center" : ""}
                `}
              >
                <span className="shrink-0 w-6 h-6 flex items-center justify-center text-base [&>svg]:w-5 [&>svg]:h-5 opacity-95">
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse (logout moved to profile menu in Navbar) */}
        <div className="p-3 border-t border-[#E0F2FE] shrink-0 space-y-0.5">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#64748B] hover:bg-white/70 hover:text-[#0F172A] transition-colors text-sm font-medium ${isCollapsed ? "justify-center" : ""}`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default SidebarBase;

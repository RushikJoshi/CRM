import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiGrid } from "react-icons/fi";

/**
 * SaaS sidebar (Minimal Indigo/Gray). UI only – no logic changes.
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
          bg-white border-r border-gray-200
          transition-all duration-300 ease-out
          ${isCollapsed ? "w-sidebar-collapsed" : "w-sidebar"}
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className={`shrink-0 border-b border-gray-200 ${isCollapsed ? "px-0 py-4" : "px-4 py-4"}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
            {logoIcon || (
              <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                <FiGrid size={18} strokeWidth={2.5} />
              </div>
            )}
            {!isCollapsed && (
              <span className="font-semibold text-gray-800 text-sm truncate">
                {logoLabel}
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
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
                    ? "bg-gray-100 text-gray-900 font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium"
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
        <div className="p-3 border-t border-gray-200 shrink-0 space-y-0.5">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm font-medium ${isCollapsed ? "justify-center" : ""}`}
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

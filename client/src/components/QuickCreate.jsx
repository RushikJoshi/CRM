import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTarget, FiInbox, FiGitBranch, FiUsers, FiBriefcase, FiUser, FiCheckCircle, FiCalendar, FiPhone } from "react-icons/fi";
import { getCurrentUser } from "../context/AuthContext";

const QuickCreate = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const userInfo = getCurrentUser();
    const role = userInfo?.role;

    const rolePrefix = (() => {
        if (role === "super_admin") return "/superadmin";
        if (role === "company_admin") return "/company";
        if (role === "branch_manager") return "/branch";
        if (role === "sales") return "/sales";
        return "/company"; // fallback
    })();

    const menuItems = [
        { label: "New Lead", path: `${rolePrefix}/leads/create`, icon: <FiTarget size={14} />, roles: ["company_admin", "branch_manager", "sales"] },
        { label: "New Deal", path: `${rolePrefix}/deals/create`, icon: <FiBriefcase size={14} />, roles: ["company_admin", "branch_manager", "sales"] },
        { label: "New Inquiry", path: `${rolePrefix}/inquiries/create`, icon: <FiInbox size={14} />, roles: ["company_admin", "branch_manager", "sales"] },
        { label: "New Task", path: `${rolePrefix}/todos/create`, icon: <FiCheckCircle size={14} />, roles: ["company_admin", "branch_manager", "sales"] },
        { label: "New User", path: `${rolePrefix}/users/create`, icon: <FiUsers size={14} />, roles: ["company_admin", "branch_manager", "super_admin"] },
        { label: "New Branch", path: `${rolePrefix}/branches/create`, icon: <FiGitBranch size={14} />, roles: ["company_admin"] },
        { label: "New Company", path: `${rolePrefix}/companies/create`, icon: <FiBriefcase size={14} />, roles: ["super_admin"] },
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNavigate = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    const filteredItems = menuItems.filter(i => !i.roles || i.roles.includes(role));

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="crm-btn-primary gap-2"
            >
                <FiPlus size={16} className={`${isOpen ? "rotate-45" : ""} transition-transform duration-200`} />
                <span className="hidden sm:inline">Quick Create</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-[var(--r-md)] border border-[var(--border)] shadow-[var(--sh-lg)] py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150 origin-top-right overflow-hidden">
                    <div className="px-3 py-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--txt4)]">Quick Actions</div>
                    {filteredItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => handleNavigate(item.path)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-[12.5px] font-medium text-[var(--txt2)] hover:bg-[var(--sb-hover)] hover:text-[var(--indigo)] transition-colors text-left"
                        >
                            <span className="opacity-60">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuickCreate;

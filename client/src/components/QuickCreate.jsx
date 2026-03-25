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
                className="btn-saas-primary gap-2"
            >
                <FiPlus size={18} className={`${isOpen ? "rotate-45" : ""} transition-transform duration-300`} />
                <span className="hidden sm:inline">Quick Action</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-[20px] border border-[#e2e8f0] shadow-xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden shadow-[#00f0ff]/5">
                    <div className="px-4 py-2 mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Creation Hub</div>
                    {filteredItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => handleNavigate(item.path)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-slate-600 hover:bg-[#f1f5f9] hover:text-[#00F0FF] transition-all text-left group"
                        >
                            <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#00F0FF]/10 group-hover:text-[#00F0FF] transition-all">
                                {React.cloneElement(item.icon, { size: 14, strokeWidth: 2.5 })}
                            </span>
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>

    );
};

export default QuickCreate;

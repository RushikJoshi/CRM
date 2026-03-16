import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import RoleGuard from "../components/RoleGuard";
import BranchManagerSidebar from "../components/sidebars/BranchManagerSidebar";
import Navbar from "../components/Navbar";

const BranchManagerLayout = () => {
    const [mobileSidebar, setMobileSidebar] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <RoleGuard allowedRole="branch_manager">
            <div className="flex h-screen bg-[#F8FAFC] overflow-hidden relative">
                <BranchManagerSidebar
                    isOpen={mobileSidebar}
                    onClose={() => setMobileSidebar(false)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                />
                <div className={`flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300 ${isCollapsed ? "lg:ml-sidebar-collapsed" : "lg:ml-sidebar"}`}>
                    <Navbar toggleMobileSidebar={() => setMobileSidebar(!mobileSidebar)} />
                    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
};

export default BranchManagerLayout;

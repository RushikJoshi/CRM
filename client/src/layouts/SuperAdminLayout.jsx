import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import RoleGuard from "../components/RoleGuard";
import SuperAdminSidebar from "../components/sidebars/SuperAdminSidebar";
import Navbar from "../components/Navbar";

const SuperAdminLayout = () => {
    const [mobileSidebar, setMobileSidebar] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <RoleGuard allowedRole="super_admin">
            <div className="flex h-screen bg-gray-50 overflow-hidden">
                <SuperAdminSidebar
                    isOpen={mobileSidebar}
                    onClose={() => setMobileSidebar(false)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                />
                {/* Main content adjusts based on sidebar state */}
                <div className={`flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300 ${isCollapsed ? "lg:ml-sidebar-collapsed" : "lg:ml-sidebar"}`}>
                    <Navbar toggleMobileSidebar={() => setMobileSidebar(!mobileSidebar)} />
                    <main className="flex-1 overflow-hidden p-4">
                        <Outlet />
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
};

export default SuperAdminLayout;

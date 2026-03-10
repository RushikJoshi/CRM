import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import RoleGuard from "../components/RoleGuard";
import SuperAdminSidebar from "../components/sidebars/SuperAdminSidebar";
import Navbar from "../components/Navbar";

const SuperAdminLayout = () => {
    const [mobileSidebar, setMobileSidebar] = useState(false);

    return (
        <RoleGuard allowedRole="super_admin">
            <div className="flex h-screen bg-gray-50 overflow-hidden">
                <SuperAdminSidebar
                    isOpen={mobileSidebar}
                    onClose={() => setMobileSidebar(false)}
                />
                {/* Main content — uses margin to accommodate the sidebar.
                    The sidebar can be 72px (collapsed) or 256px (expanded),
                    but since it's fixed we just use lg:ml-64 as before.
                    The sidebar itself manages its own collapse state. */}
                <div className="flex flex-col flex-1 lg:ml-64 min-w-0 overflow-hidden transition-all duration-300">
                    <Navbar toggleMobileSidebar={() => setMobileSidebar(!mobileSidebar)} />
                    <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
};

export default SuperAdminLayout;

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import RoleGuard from "../components/RoleGuard";
import SalesSidebar from "../components/sidebars/SalesSidebar";
import Navbar from "../components/Navbar";

const SalesUserLayout = () => {
    const [mobileSidebar, setMobileSidebar] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <RoleGuard allowedRole="sales">
            <div className="flex h-screen bg-gray-50 overflow-hidden relative">
                <SalesSidebar
                    isOpen={mobileSidebar}
                    onClose={() => setMobileSidebar(false)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                />
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

export default SalesUserLayout;

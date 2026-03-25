import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import RoleGuard from "../components/RoleGuard";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import SubscriptionBanner from "../components/SubscriptionBanner";

const CompanyAdminLayout = () => {
    const [mobileSidebar, setMobileSidebar] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <RoleGuard allowedRole="company_admin">
            <div className="flex h-screen bg-[#f5f6fb] overflow-hidden">
                <Sidebar
                    isMobileOpen={mobileSidebar}
                    setIsMobileOpen={setMobileSidebar}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                />
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300">
                    <Navbar toggleMobileSidebar={() => setMobileSidebar(!mobileSidebar)} />
                    <SubscriptionBanner />
                    <main className="flex-1 overflow-y-auto px-[16px] py-[10px]">
                        <div className="animate-page-in">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
};

export default CompanyAdminLayout;

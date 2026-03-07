import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import RoleGuard from "../components/RoleGuard";
import CompanyAdminSidebar from "../components/sidebars/CompanyAdminSidebar";
import Navbar from "../components/Navbar";

const CompanyAdminLayout = () => {
    const [mobileSidebar, setMobileSidebar] = useState(false);

    return (
        <RoleGuard allowedRole="company_admin">
            <div className="flex h-screen bg-gray-50 overflow-hidden relative">
                <CompanyAdminSidebar isOpen={mobileSidebar} onClose={() => setMobileSidebar(false)} />
                <div className="flex flex-col flex-1 lg:ml-64 min-w-0 overflow-hidden transition-all duration-300">
                    <Navbar toggleMobileSidebar={() => setMobileSidebar(!mobileSidebar)} />
                    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
};

export default CompanyAdminLayout;

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import RoleGuard from "../components/RoleGuard";
import SalesSidebar from "../components/sidebars/SalesSidebar";
import Navbar from "../components/Navbar";

const SalesUserLayout = () => {
    const [mobileSidebar, setMobileSidebar] = useState(false);

    return (
        <RoleGuard allowedRole="sales">
            <div className="flex h-screen bg-gray-50 overflow-hidden">
                <SalesSidebar />
                <div className="flex flex-col flex-1 ml-64 min-w-0 overflow-hidden transition-all duration-300">
                    <Navbar toggleMobileSidebar={() => setMobileSidebar(!mobileSidebar)} />
                    <main className="flex-1 overflow-y-auto p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
};

export default SalesUserLayout;

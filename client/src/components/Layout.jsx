import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const onResize = () => {
            const w = window.innerWidth;
            if (w < 1280) setIsCollapsed(true);
            if (w >= 1280) setIsCollapsed(false);
            if (w >= 1024) setIsMobileSidebarOpen(false);
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const toggleMobileSidebar = () => setIsMobileSidebarOpen((o) => !o);

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isMobileOpen={isMobileSidebarOpen}
            />

            {isMobileSidebarOpen && (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    onKeyDown={(e) => e.key === "Escape" && setIsMobileSidebarOpen(false)}
                    className="fixed inset-0 bg-black/20 z-[60] backdrop-blur-sm lg:hidden transition-opacity duration-200"
                    aria-label="Close menu"
                />
            )}

            <div
                className={`flex-1 flex flex-col min-w-0 transition-all duration-300 pl-0 h-screen`}
                style={{ paddingLeft: window.innerWidth >= 1024 ? (isCollapsed ? "var(--sb-collapsed)" : "var(--sb-width)") : "0" }}
            >

                <Navbar toggleMobileSidebar={toggleMobileSidebar} />

                <main className="flex-1 overflow-y-auto w-full">
                    <div className="p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>

                <footer className="flex-none h-12 border-t border-[#E5E7EB] flex items-center justify-between px-6 bg-white text-[#6B7280] text-xs font-medium">
                    <span>&copy; {new Date().getFullYear()} CRM</span>
                    <span>Gitakshmi Labs</span>
                </footer>
            </div>
        </div>
    );
};

export default Layout;

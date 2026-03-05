import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Toggle for mobile menu if sidebar becomes fully mobile-first
    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar (Desktop Persistent, Mobile Drawer) */}
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isMobileOpen={isMobileSidebarOpen}
            />

            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="fixed inset-0 bg-gray-900/60 z-[60] backdrop-blur-sm lg:hidden h-screen w-full transition-all duration-300"
                />
            )}

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"
                } pl-0 h-screen`}>
                <Navbar toggleMobileSidebar={toggleMobileSidebar} />

                <main className="flex-1 p-4 md:p-6 lg:p-8 w-full overflow-y-auto bg-gray-50/50">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-[100%]">
                        {children}
                    </div>
                </main>

                <footer className="h-14 flex-none border-t border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>&copy; {new Date().getFullYear()} CRM PRO • Decentralized Node</span>
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-green-600 transition-colors">Security Protocol</a>
                        <a href="#" className="hover:text-green-600 transition-colors">Architecture Terms</a>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Layout;

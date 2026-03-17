import React, { useContext } from "react";
import {
  FiLayout,
  FiBriefcase,
  FiCreditCard,
  FiPackage,
  FiUsers,
  FiBarChart2,
  FiFileText,
  FiSettings,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import SidebarBase from "../SidebarBase";

const SUPER_ADMIN_MENU = [
  { name: "Dashboard", icon: <FiLayout />, path: "/superadmin/dashboard" },
  { name: "Companies", icon: <FiBriefcase />, path: "/superadmin/companies" },
  { name: "Subscriptions", icon: <FiCreditCard />, path: "/superadmin/subscriptions" },
  { name: "Plans", icon: <FiPackage />, path: "/superadmin/plans" },
  { name: "Platform Users", icon: <FiUsers />, path: "/superadmin/users" },
  { name: "Platform Analytics", icon: <FiBarChart2 />, path: "/superadmin/usage-analytics" },
  { name: "System Logs", icon: <FiFileText />, path: "/superadmin/system-logs" },
  { name: "Settings", icon: <FiSettings />, path: "/superadmin/settings" },
];

const SuperAdminSidebar = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const { logout } = useContext(AuthContext);

  return (
    <SidebarBase
      menuItems={SUPER_ADMIN_MENU}
      isOpen={isOpen}
      onClose={onClose}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      onLogout={logout}
      logoLabel="CRM"
    />
  );
};

export default SuperAdminSidebar;

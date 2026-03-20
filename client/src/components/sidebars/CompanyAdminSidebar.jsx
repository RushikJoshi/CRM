import React, { useContext } from "react";
import {
  FiLayout,
  FiGitBranch,
  FiUsers,
  FiTarget,
  FiTrendingUp,
  FiBriefcase,
  FiUser,
  FiLayers,
  FiCheckSquare,
  FiActivity,
  FiPieChart,
  FiZap,
  FiSettings,
  FiInbox,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import SidebarBase from "../SidebarBase";

const COMPANY_ADMIN_MENU = [
  { name: "Dashboard", icon: <FiLayout />, path: "/company/dashboard" },
  { name: "Branches", icon: <FiGitBranch />, path: "/company/branches" },
  { name: "Users", icon: <FiUsers />, path: "/company/users" },
  { name: "Inquiries", icon: <FiTarget />, path: "/company/inquiries" },
  { name: "Leads", icon: <FiTarget />, path: "/company/leads" },
  { name: "Prospects", icon: <FiTrendingUp />, path: "/company/prospects" },
  { name: "Accounts", icon: <FiBriefcase />, path: "/company/customers" },
  { name: "Contacts", icon: <FiUser />, path: "/company/contacts" },
  { name: "Pipeline", icon: <FiLayers />, path: "/company/pipeline" },
  { name: "Meetings", icon: <FiActivity />, path: "/company/meetings" },
  { name: "Tasks", icon: <FiCheckSquare />, path: "/company/tasks" },
  { name: "Activities", icon: <FiActivity />, path: "/company/activities" },
  { name: "Reports", icon: <FiPieChart />, path: "/company/reports" },
  { name: "Automation", icon: <FiZap />, path: "/company/automation" },
  { name: "Settings", icon: <FiSettings />, path: "/company/settings" },
];

const CompanyAdminSidebar = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const { logout } = useContext(AuthContext);

  return (
    <SidebarBase
      menuItems={COMPANY_ADMIN_MENU}
      isOpen={isOpen}
      onClose={onClose}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      onLogout={logout}
      logoLabel="Horizon CRM"
    />
  );
};

export default CompanyAdminSidebar;

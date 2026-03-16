import React, { useContext } from "react";
import {
  FiLayout,
  FiTarget,
  FiTrendingUp,
  FiBriefcase,
  FiUser,
  FiLayers,
  FiCheckSquare,
  FiActivity,
  FiPieChart,
  FiSettings,
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { AuthContext } from "../../context/AuthContext";
import SidebarBase from "../SidebarBase";

const BRANCH_MANAGER_MENU = [
  { name: "Dashboard", icon: <FiLayout />, path: "/branch/dashboard" },
  { name: "Inquiries", icon: <FiTarget />, path: "/branch/inquiries" },
  { name: "Branch Leads", icon: <FiTarget />, path: "/branch/leads" },
  { name: "Branch Prospects", icon: <FiTrendingUp />, path: "/branch/prospects" },
  { name: "Branch Deals", icon: <FaIndianRupeeSign />, path: "/branch/deals" },
  { name: "Accounts", icon: <FiBriefcase />, path: "/branch/customers" },
  { name: "Contacts", icon: <FiUser />, path: "/branch/contacts" },
  { name: "Pipeline", icon: <FiLayers />, path: "/branch/pipeline" },
  { name: "Meetings", icon: <FiActivity />, path: "/branch/meetings" },
  { name: "Tasks", icon: <FiCheckSquare />, path: "/branch/tasks" },
  { name: "Activities", icon: <FiActivity />, path: "/branch/activities" },
  { name: "Reports", icon: <FiPieChart />, path: "/branch/reports" },
  { name: "Settings", icon: <FiSettings />, path: "/branch/settings" },
];

const BranchManagerSidebar = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const { logout } = useContext(AuthContext);

  return (
    <SidebarBase
      menuItems={BRANCH_MANAGER_MENU}
      isOpen={isOpen}
      onClose={onClose}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      onLogout={logout}
      logoLabel="Horizon CRM"
    />
  );
};

export default BranchManagerSidebar;

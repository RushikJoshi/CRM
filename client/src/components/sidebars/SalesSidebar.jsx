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
  FiPhone,
  FiCalendar,
  FiInbox,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import SidebarBase from "../SidebarBase";

const SALES_MENU = [
  { name: "My Dashboard", icon: <FiLayout />, path: "/sales/dashboard" },
  { name: "My Inquiries", icon: <FiInbox />, path: "/sales/inquiries" },
  { name: "My Leads", icon: <FiTarget />, path: "/sales/leads" },
  { name: "My Prospects", icon: <FiTrendingUp />, path: "/sales/prospects" },
  { name: "My Accounts", icon: <FiBriefcase />, path: "/sales/customers" },
  { name: "My Contacts", icon: <FiUser />, path: "/sales/contacts" },
  { name: "Pipeline", icon: <FiLayers />, path: "/sales/pipeline" },
  { name: "Tasks", icon: <FiCheckSquare />, path: "/sales/tasks" },
  { name: "Activities", icon: <FiActivity />, path: "/sales/activities" },
  { name: "Calls", icon: <FiPhone />, path: "/sales/calls" },
  { name: "Meetings", icon: <FiCalendar />, path: "/sales/meetings" },
];

const SalesSidebar = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const { logout } = useContext(AuthContext);

  return (
    <SidebarBase
      menuItems={SALES_MENU}
      isOpen={isOpen}
      onClose={onClose}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      onLogout={logout}
      logoLabel="EduPath Pro"
    />
  );
};

export default SalesSidebar;

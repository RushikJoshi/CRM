import { Routes, Route, Navigate } from "react-router-dom";
import { ROLE_HOME } from "./context/AuthContext";
import SessionGuard from "./components/SessionGuard";

// Layouts — each wraps its own RoleGuard
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import CompanyAdminLayout from "./layouts/CompanyAdminLayout";
import BranchManagerLayout from "./layouts/BranchManagerLayout";
import SalesUserLayout from "./layouts/SalesUserLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Branches from "./pages/Branches";
import Users from "./pages/Users";
import Leads from "./pages/Leads";
import Deals from "./pages/Deals";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Master from "./pages/Master";
import Customers from "./pages/Customers";
import Contacts from "./pages/Contacts";
import Calls from "./pages/Calls";
import Meetings from "./pages/Meetings";
import Todos from "./pages/Todos";
import Calendar from "./pages/Calendar";
import Automation from "./pages/Automation";
import Inquiries from "./pages/Inquiries";
import CustomerDetails from "./pages/CustomerDetails";

/** Redirect logged-in users to their role home, show login if not */
const SmartRedirect = () => {
  const token = localStorage.getItem("token");
  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { }
  if (token && user?.role) {
    const home = ROLE_HOME[user.role];
    if (home) return <Navigate to={home} replace />;
  }
  return <Login />;
};

/** Wildcard / legacy /dashboard redirect to correct home */
const FallbackRedirect = () => {
  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { }
  const home = user?.role ? ROLE_HOME[user.role] : null;
  return <Navigate to={home || "/"} replace />;
};

function App() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<SmartRedirect />} />

      {/* ════════════════════════════════════
          SUPER ADMIN  —  /superadmin/*
          Role enforced by SuperAdminLayout > RoleGuard(super_admin)
      ════════════════════════════════════ */}
      <Route element={<SessionGuard><SuperAdminLayout /></SessionGuard>}>
        <Route path="/superadmin/dashboard" element={<Dashboard />} />
        <Route path="/superadmin/companies" element={<Companies />} />
        <Route path="/superadmin/reports" element={<Reports />} />
        <Route path="/superadmin/automation" element={<Automation />} />
        <Route path="/superadmin/settings" element={<Settings />} />
        {/* Alias shortcuts used by sidebar links */}
        <Route path="/companies" element={<Companies />} />
        <Route path="/automation" element={<Automation />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* ════════════════════════════════════
          COMPANY ADMIN  —  /company/*
          Role enforced by CompanyAdminLayout > RoleGuard(company_admin)
      ════════════════════════════════════ */}
      <Route element={<SessionGuard><CompanyAdminLayout /></SessionGuard>}>
        <Route path="/company/dashboard" element={<Dashboard />} />
        <Route path="/inquiries" element={<Inquiries />} />
        <Route path="/master" element={<Master />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/users" element={<Users />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetails />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/calls" element={<Calls />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/todos" element={<Todos />} />
        <Route path="/calendar" element={<Calendar />} />
      </Route>

      {/* ════════════════════════════════════
          BRANCH MANAGER  —  /branch/*
          Role enforced by BranchManagerLayout > RoleGuard(branch_manager)
      ════════════════════════════════════ */}
      <Route element={<SessionGuard><BranchManagerLayout /></SessionGuard>}>
        <Route path="/branch/dashboard" element={<Dashboard />} />
        <Route path="/branch/leads" element={<Leads />} />
        <Route path="/branch/customers" element={<Customers />} />
        <Route path="/branch/customers/:id" element={<CustomerDetails />} />
        <Route path="/branch/contacts" element={<Contacts />} />
        <Route path="/branch/deals" element={<Deals />} />
        <Route path="/branch/calls" element={<Calls />} />
        <Route path="/branch/meetings" element={<Meetings />} />
        <Route path="/branch/todos" element={<Todos />} />
        <Route path="/branch/reports" element={<Reports />} />
      </Route>

      {/* ════════════════════════════════════
          SALES USER  —  /sales/*
          Role enforced by SalesUserLayout > RoleGuard(sales)
      ════════════════════════════════════ */}
      <Route element={<SessionGuard><SalesUserLayout /></SessionGuard>}>
        <Route path="/sales/dashboard" element={<Dashboard />} />
        <Route path="/sales/leads" element={<Leads />} />
        <Route path="/sales/customers" element={<Customers />} />
        <Route path="/sales/customers/:id" element={<CustomerDetails />} />
        <Route path="/sales/deals" element={<Deals />} />
        <Route path="/sales/calls" element={<Calls />} />
        <Route path="/sales/meetings" element={<Meetings />} />
        <Route path="/sales/todos" element={<Todos />} />
      </Route>

      {/* ── Legacy /dashboard → role home ── */}
      <Route path="/dashboard" element={<FallbackRedirect />} />

      {/* ── Catch-all ── */}
      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  );
}

export default App;
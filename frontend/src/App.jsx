import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getSessionKeyForPath, readSession, ROLE_HOME } from "./context/AuthContext";

// ── Lazy-loaded Layouts ───────────────────────────────────────────────────────
const SuperAdminLayout = lazy(() => import("./layouts/SuperAdminLayout"));
const CompanyAdminLayout = lazy(() => import("./layouts/CompanyAdminLayout"));
const BranchManagerLayout = lazy(() => import("./layouts/BranchManagerLayout"));
const SalesUserLayout = lazy(() => import("./layouts/SalesUserLayout"));

// ── Lazy-loaded Pages ─────────────────────────────────────────────────────────
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Companies = lazy(() => import("./pages/Companies"));
const Branches = lazy(() => import("./pages/Branches"));
const Users = lazy(() => import("./pages/Users"));
const Leads = lazy(() => import("./pages/Leads"));
const Deals = lazy(() => import("./pages/Deals"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Master = lazy(() => import("./pages/Master"));
const Customers = lazy(() => import("./pages/Customers"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Calls = lazy(() => import("./pages/Calls"));
const Meetings = lazy(() => import("./pages/Meetings"));
const Todos = lazy(() => import("./pages/Todos"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Automation = lazy(() => import("./pages/Automation"));
const Inquiries = lazy(() => import("./pages/Inquiries"));
const CustomerDetails = lazy(() => import("./pages/CustomerDetails"));

// ── Lazy-loaded Full-page Form Pages ─────────────────────────────────────────
const CompanyFormPage = lazy(() => import("./pages/forms/CompanyFormPage"));
const BranchFormPage = lazy(() => import("./pages/forms/BranchFormPage"));
const UserFormPage = lazy(() => import("./pages/forms/UserFormPage"));
const LeadFormPage = lazy(() => import("./pages/forms/LeadFormPage"));
const DealFormPage = lazy(() => import("./pages/forms/DealFormPage"));
const ContactFormPage = lazy(() => import("./pages/forms/ContactFormPage"));
const InquiryFormPage = lazy(() => import("./pages/forms/InquiryFormPage"));
const ConvertInquiryFormPage = lazy(() => import("./pages/forms/ConvertInquiryFormPage"));

// ── Page loading fallback ─────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-green-100 border-t-green-500 rounded-full animate-spin" />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading...</p>
    </div>
  </div>
);

// ── Smart redirect from / ─────────────────────────────────────────────────────
// If user has a valid session for any role → send to their home.
// Otherwise → /login
const SmartRedirect = () => {
  const roleKeys = [
    { key: "sa_session", role: "super_admin" },
    { key: "ca_session", role: "company_admin" },
    { key: "bm_session", role: "branch_manager" },
    { key: "su_session", role: "sales" },
  ];
  for (const { key } of roleKeys) {
    const session = readSession(key);
    if (session?.token && session?.user?.role) {
      return <Navigate to={ROLE_HOME[session.user.role]} replace />;
    }
  }
  return <Navigate to="/login" replace />;
};

// ── Fallback for unknown routes ───────────────────────────────────────────────
const FallbackRedirect = () => {
  const key = getSessionKeyForPath(window.location.pathname);
  const session = readSession(key);
  if (session?.user?.role) {
    return <Navigate to={ROLE_HOME[session.user.role]} replace />;
  }
  return <Navigate to="/login" replace />;
};

// ── SessionGuard (inline — avoids import cycle with lazy) ────────────────────
import SessionGuard from "./components/SessionGuard";

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Root ── */}
        <Route path="/" element={<SmartRedirect />} />
        <Route path="/login" element={<Login />} />

        {/* ════════════════════════════════════
            SUPER ADMIN  ─  /superadmin/*
        ════════════════════════════════════ */}
        <Route element={<SessionGuard><SuperAdminLayout /></SessionGuard>}>
          <Route path="/superadmin/dashboard" element={<Dashboard />} />
          <Route path="/superadmin/companies" element={<Companies />} />
          <Route path="/superadmin/companies/create" element={<CompanyFormPage />} />
          <Route path="/superadmin/companies/:id/edit" element={<CompanyFormPage />} />
          <Route path="/superadmin/branches" element={<Branches />} />
          <Route path="/superadmin/branches/create" element={<BranchFormPage />} />
          <Route path="/superadmin/branches/:id/edit" element={<BranchFormPage />} />
          <Route path="/superadmin/users" element={<Users />} />
          <Route path="/superadmin/users/create" element={<UserFormPage />} />
          <Route path="/superadmin/users/:id/edit" element={<UserFormPage />} />
          <Route path="/superadmin/reports" element={<Reports />} />
          <Route path="/superadmin/automation" element={<Automation />} />
          <Route path="/superadmin/settings" element={<Settings />} />
        </Route>

        {/* ════════════════════════════════════
            COMPANY ADMIN  ─  /company/*
        ════════════════════════════════════ */}
        <Route element={<SessionGuard><CompanyAdminLayout /></SessionGuard>}>
          <Route path="/company/dashboard" element={<Dashboard />} />
          <Route path="/company/inquiries" element={<Inquiries />} />
          <Route path="/company/inquiries/create" element={<InquiryFormPage />} />
          <Route path="/company/inquiries/:id/convert" element={<ConvertInquiryFormPage />} />
          <Route path="/company/master" element={<Master />} />
          <Route path="/company/branches" element={<Branches />} />
          <Route path="/company/branches/create" element={<BranchFormPage />} />
          <Route path="/company/branches/:id/edit" element={<BranchFormPage />} />
          <Route path="/company/users" element={<Users />} />
          <Route path="/company/users/create" element={<UserFormPage />} />
          <Route path="/company/users/:id/edit" element={<UserFormPage />} />
          <Route path="/company/leads" element={<Leads />} />
          <Route path="/company/leads/create" element={<LeadFormPage />} />
          <Route path="/company/leads/:id/edit" element={<LeadFormPage />} />
          <Route path="/company/customers" element={<Customers />} />
          <Route path="/company/customers/:id" element={<CustomerDetails />} />
          <Route path="/company/contacts" element={<Contacts />} />
          <Route path="/company/contacts/create" element={<ContactFormPage />} />
          <Route path="/company/contacts/:id/edit" element={<ContactFormPage />} />
          <Route path="/company/deals" element={<Deals />} />
          <Route path="/company/deals/create" element={<DealFormPage />} />
          <Route path="/company/deals/:id/edit" element={<DealFormPage />} />
          <Route path="/company/calls" element={<Calls />} />
          <Route path="/company/meetings" element={<Meetings />} />
          <Route path="/company/todos" element={<Todos />} />
          <Route path="/company/calendar" element={<Calendar />} />
          <Route path="/company/reports" element={<Reports />} />
        </Route>

        {/* ════════════════════════════════════
            BRANCH MANAGER  ─  /branch/*
        ════════════════════════════════════ */}
        <Route element={<SessionGuard><BranchManagerLayout /></SessionGuard>}>
          <Route path="/branch/dashboard" element={<Dashboard />} />
          <Route path="/branch/inquiries" element={<Inquiries />} />
          <Route path="/branch/inquiries/create" element={<InquiryFormPage />} />
          <Route path="/branch/inquiries/:id/convert" element={<ConvertInquiryFormPage />} />
          <Route path="/branch/leads" element={<Leads />} />
          <Route path="/branch/leads/create" element={<LeadFormPage />} />
          <Route path="/branch/leads/:id/edit" element={<LeadFormPage />} />
          <Route path="/branch/customers" element={<Customers />} />
          <Route path="/branch/customers/:id" element={<CustomerDetails />} />
          <Route path="/branch/contacts" element={<Contacts />} />
          <Route path="/branch/contacts/create" element={<ContactFormPage />} />
          <Route path="/branch/contacts/:id/edit" element={<ContactFormPage />} />
          <Route path="/branch/deals" element={<Deals />} />
          <Route path="/branch/deals/create" element={<DealFormPage />} />
          <Route path="/branch/deals/:id/edit" element={<DealFormPage />} />
          <Route path="/branch/calls" element={<Calls />} />
          <Route path="/branch/meetings" element={<Meetings />} />
          <Route path="/branch/todos" element={<Todos />} />
          <Route path="/branch/reports" element={<Reports />} />
          <Route path="/branch/users" element={<Users />} />
          <Route path="/branch/users/create" element={<UserFormPage />} />
          <Route path="/branch/users/:id/edit" element={<UserFormPage />} />
        </Route>

        {/* ════════════════════════════════════
            SALES USER  ─  /sales/*
        ════════════════════════════════════ */}
        <Route element={<SessionGuard><SalesUserLayout /></SessionGuard>}>
          <Route path="/sales/dashboard" element={<Dashboard />} />
          <Route path="/sales/inquiries" element={<Inquiries />} />
          <Route path="/sales/inquiries/create" element={<InquiryFormPage />} />
          <Route path="/sales/inquiries/:id/convert" element={<ConvertInquiryFormPage />} />
          <Route path="/sales/leads" element={<Leads />} />
          <Route path="/sales/leads/create" element={<LeadFormPage />} />
          <Route path="/sales/leads/:id/edit" element={<LeadFormPage />} />
          <Route path="/sales/customers" element={<Customers />} />
          <Route path="/sales/customers/:id" element={<CustomerDetails />} />
          <Route path="/sales/contacts" element={<Contacts />} />
          <Route path="/sales/contacts/create" element={<ContactFormPage />} />
          <Route path="/sales/contacts/:id/edit" element={<ContactFormPage />} />
          <Route path="/sales/deals" element={<Deals />} />
          <Route path="/sales/deals/create" element={<DealFormPage />} />
          <Route path="/sales/deals/:id/edit" element={<DealFormPage />} />
          <Route path="/sales/calls" element={<Calls />} />
          <Route path="/sales/meetings" element={<Meetings />} />
          <Route path="/sales/todos" element={<Todos />} />
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<FallbackRedirect />} />
      </Routes>
    </Suspense>
  );
}

export default App;
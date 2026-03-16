# CRM Project – Process and Flow (Complete Reference)

This document describes the **entire process and flow** of the CRM application: structure, authentication, roles, routes, APIs, data models, and step-by-step user journeys. Nothing is omitted.

---

## 0. Enterprise Multi-Tenant Architecture

The system is a **multi-tenant SaaS CRM** with strict separation between platform administration and company CRM operations.

### 0.1 Hierarchy

| Level | Entity | Scope |
|-------|--------|--------|
| **Product** | Super Admin | Platform-wide: companies, subscriptions, billing, platform analytics, system monitoring |
| **Tenant** | Company | All CRM data for one organization (leads, deals, pipeline, automation, reports) |
| **Sub-tenant** | Branch | Optional; branch-scoped leads/deals/users for Company Admin / Branch Admin |
| **User** | Users | Role-based access within company/branch |

### 0.2 Roles and Responsibilities

| Role | Responsibilities |
|------|------------------|
| **Product Super Admin** | Manage companies; manage subscriptions and billing; platform analytics; system monitoring. Does **not** view company leads/deals unless using a dedicated “impersonate company” mode. |
| **Company Admin** | Configure CRM; manage users and branches; configure pipelines and automation; full company data access. |
| **Branch Admin** | Manage branch leads and deals; monitor team performance; branch-scoped data. |
| **Sales User** | Manage assigned leads; track deals; log activities; manage tasks. |

### 0.3 Tenant Isolation

- All CRM data is isolated by **companyId** (and **branchId** where applicable).
- APIs enforce **checkCompanyAccess** and role checks so users only access data allowed by their role.
- Super Admin panel shows **platform metrics only** (companies, users, revenue, health); CRM sales widgets (revenue charts, pipeline, conversion) live on **company dashboards** only.

### 0.4 CRM Sales Lifecycle (Enterprise)

The system supports the full lifecycle:

Lead Capture → Lead Qualification → MQL → SQL → Prospect → Opportunity → Needs Analysis → Solution Presentation → Proposal / Quotation → Negotiation → Decision → Closed Won / Closed Lost → Customer → Customer Success → Renewal / Upsell.

Pipeline stages (configurable per company) include: **New Lead**, **Attempted Contact**, **Contacted**, **Qualified**, **Prospect**, **Needs Analysis**, **Proposal Sent**, **Negotiation**, **Decision Pending**, **Closed Won**, **Closed Lost**. Each stage supports probability percentages, revenue forecasting, and stage automation triggers.

### 0.5 Activity Timeline and Audit

- **Activity** model: user-facing timeline on Lead, Deal, Customer, Contact (events: lead created, assigned, status change, calls, meetings, notes, deal stage changes, task updates). Chronological order; entries include activityType, userId, objectId, objectType, description, timestamp.
- **AuditLog** model: immutable enterprise audit trail for compliance. Every create/update/delete on key entities (Lead, Deal, etc.) writes an audit entry: userId, action, objectType, objectId, companyId, changes, timestamp. Access via `GET /api/audit-logs` with tenant isolation and pagination.

### 0.6 Automation and AI

- **Triggers:** lead_created, lead_assigned, lead_qualified, deal_created, deal_stage_changed, task_overdue, meeting_scheduled.
- **Actions:** assign_to_branch, assign_to_user, create_notification, create_task, send_email, update_lead_score, move_pipeline_stage. Rules are configurable per company.
- **AI lead scoring:** source, engagement, response time, activity count. **Predictive deal forecasting:** stage, engagement, historical win rate. Pipeline revenue forecast uses stage probabilities.

### 0.7 Security and Performance

- **RBAC**, JWT auth, **rate limiting** (login 100/15min; global API 500/15min per IP via `API_RATE_LIMIT_MAX`), input validation, tenant isolation.
- **Database indexing:** compound indexes on Lead, Deal, Customer, Activity (e.g. companyId + updatedAt, companyId + status, pipelineId + stageId) to support 10,000+ leads per company and fast queries. Pagination and lazy loading on frontend.

---

## 1. Project Overview

- **Type:** Monorepo (frontend + backend in one repo).
- **Frontend:** React 19 + Vite 7, react-router, axios, recharts, framer-motion, @dnd-kit.
- **Backend:** Node.js + Express, MongoDB (Mongoose), JWT auth, bcryptjs.
- **Entry points:**
  - **Backend:** `server/server.js`
  - **Frontend:** `client/index.html` → `client/src/main.jsx` → `App.jsx`

### 1.1 Directory Structure

```
CRM PROJECT/
├── client/                    # React + Vite frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.jsx           # BrowserRouter, AuthProvider, ToastProvider, App
│   │   ├── App.jsx            # All routes + role-based layouts
│   │   ├── config/api.js      # API_BASE_URL, APP_NAME (env-driven)
│   │   ├── services/api.js    # Axios instance, JWT by path, 401 handling
│   │   ├── context/           # AuthContext, ToastContext
│   │   ├── utils/tokenManager.js  # Panel-specific tokens
│   │   ├── components/        # SessionGuard, ProtectedRoute, Layout, Navbar, Sidebar,
│   │   │                      # LoginForm, sidebars, LeadTable, DealPipeline, Inquiries, etc.
│   │   ├── layouts/           # SuperAdminLayout, CompanyAdminLayout, BranchManagerLayout, SalesUserLayout
│   │   ├── pages/             # Dashboard, Leads, Deals, Inquiries, Customers, Reports, etc.
│   │   └── hooks/
│   └── public/
├── server/                    # Node + Express backend
│   ├── server.js              # Express app, CORS, helmet, rate limit, routes, DB, error handler
│   ├── middleware/            # auth, requireRole, checkCompanyAccess, superAdmin, upload
│   ├── controllers/           # auth, lead, deal, inquiry, dashboard, crm, pipeline, automation, etc.
│   ├── models/                # User, Company, Branch, Lead, Deal, Inquiry, Customer, etc.
│   ├── routes/                # All API route modules
│   └── utils/                 # leadManagement, automationEngine, notificationService, auditLogger, masterSeeder
├── tests/                     # Playwright
├── .github/workflows/playwright.yml
└── .gitignore
```

---

## 2. How to Run

- **Backend:** From project root, `npm run dev` (or run `server/server.js`); uses `PORT` (default 5000) and `MONGO_URI`.
- **Frontend:** From `client/`, `npm run dev`; uses Vite dev server; `API_BASE_URL` points to backend.

---

## 3. Authentication and Authorization

### 3.1 Backend Auth

| Item | Detail |
|------|--------|
| **Auth routes** | `/api/auth` (see Section 7). |
| **Login** | `POST /api/auth/login` — body: `{ email, password }`. Returns JWT + user (id, role, companyId, branchId). User must have `status: "active"`. |
| **Token** | JWT in `Authorization: Bearer <token>`, 1-day expiry. |
| **Middleware `auth.js`** | Verifies JWT → sets `req.user` (id, role, companyId, branchId). |
| **Middleware `requireRole(...roles)`** | Allows only listed roles. |
| **Middleware `checkCompanyAccess`** | Super_admin bypass; else enforces companyId (and branchId for branch_manager) from token vs params/body/query. |
| **Rate limiting** | `/api/auth/login`: 100 requests per 15 minutes per IP. |

### 3.2 Frontend Auth

| Item | Detail |
|------|--------|
| **AuthContext** | `login(token, user)` stores token and user in **role-specific** localStorage keys; `logout()` clears current role’s data and redirects to `/login`. |
| **Session keys** | `superAdminUser`/`superAdminToken`, `companyUser`/`companyToken`, `branchUser`/`branchToken`, `salesUser`/`salesToken` (from `USER_DATA_KEYS` and `tokenManager`). |
| **SessionGuard** | On each route, derives role from path (`/superadmin` → super_admin, `/company` → company_admin, `/branch` → branch_manager, `/sales` → sales). If that role has no valid token/user, redirects to `/login`. |
| **Login flow** | User submits email/password → `POST /api/auth/login` → frontend calls `login(token, user)` and redirects to `ROLE_HOME[user.role]`. |

### 3.3 Roles and Home Paths

| Role | Home path |
|------|-----------|
| super_admin | /superadmin/dashboard |
| company_admin | /company/dashboard |
| branch_manager | /branch/dashboard |
| sales | /sales/dashboard |

- **Root `/`:** If any role has a valid session, redirect to that role’s home; else redirect to `/login`.
- **Catch-all `*`:** Uses path to infer role; if that role has session, redirect to its home; else `/login`.

---

## 4. Frontend Routes (by Role)

All protected routes are wrapped in `SessionGuard` and the corresponding layout.

### 4.1 Public

| Path | Page |
|------|------|
| / | SmartRedirect (→ role home or /login) |
| /login | Login |

### 4.2 Super Admin (`/superadmin/*`) – Platform Only

Super Admin has **no** access to company CRM data (leads, deals, pipeline, reports). Only platform management and analytics.

| Path | Page |
|------|------|
| /superadmin/dashboard | Dashboard (platform metrics only) |
| /superadmin/companies | Companies |
| /superadmin/companies/create | CompanyFormPage |
| /superadmin/companies/:id | CompanyDetailPage |
| /superadmin/companies/:id/edit | CompanyFormPage |
| /superadmin/subscriptions | Subscriptions (placeholder) |
| /superadmin/plans | Plans (placeholder) |
| /superadmin/users | Platform Users |
| /superadmin/users/create | UserFormPage |
| /superadmin/users/:id/edit | UserFormPage |
| /superadmin/billing | Billing (placeholder) |
| /superadmin/usage-analytics | Usage Analytics (placeholder) |
| /superadmin/system-logs | System Logs (placeholder) |
| /superadmin/api-keys | API Keys (placeholder) |
| /superadmin/settings | Settings |

### 4.3 Company Admin (`/company/*`)

| Path | Page |
|------|------|
| /company/dashboard | Dashboard |
| /company/branches | Branches (+ create, :id/edit) |
| /company/users | Users (+ create, :id/edit) |
| /company/leads | Leads (+ create, :id/edit) |
| /company/prospects | Prospects |
| /company/deals | Deals (+ create, :id/edit) |
| /company/contacts | Contacts (+ create, :id/edit) |
| /company/customers | Customers, CustomerDetails |
| /company/inquiries | Inquiries (+ create, :id/edit, :id/convert) |
| /company/reports | Reports |
| /company/master | Master |
| /company/activities | Activities |
| /company/tasks | Tasks |
| /company/pipeline | DealPipelinePage |
| /company/calls | Calls |
| /company/meetings | Meetings |
| /company/targets | Targets |
| /company/analytics | AnalyticsDashboard |
| /company/branch-analytics | BranchAnalytics |
| /company/leaderboard | Leaderboard |
| /company/planner | SalesPlanner |
| /company/automation | Automation |
| /company/settings | Settings |

### 4.4 Branch Manager (`/branch/*`)

Same as Company Admin **except:** no Companies, no Master (per route list). Includes: dashboard, branches (view), users, leads, prospects, deals, contacts, customers, inquiries, reports, activities, tasks, pipeline, calls, meetings, targets, analytics, branch-analytics, leaderboard, planner, settings.

### 4.5 Sales (`/sales/*`)

| Path | Page |
|------|------|
| /sales/dashboard | Dashboard |
| /sales/planner | SalesPlanner |
| /sales/leads | Leads (+ create, :id/edit) |
| /sales/prospects | Prospects |
| /sales/deals | Deals (+ create, :id/edit) |
| /sales/contacts | Contacts (+ create, :id/edit) |
| /sales/customers | Customers, CustomerDetails |
| /sales/inquiries | Inquiries (+ create, :id/edit, :id/convert) |
| /sales/calls | Calls |
| /sales/meetings | Meetings |
| /sales/activities | Activities |
| /sales/tasks | Tasks |
| /sales/pipeline | DealPipelinePage |
| /sales/analytics | AnalyticsDashboard |
| /sales/settings | Settings |

(No: companies, branches, users, reports, master, targets, branch-analytics, leaderboard, automation.)

---

## 5. API Routes (Backend)

Base prefix: `/api`. Auth/role/company checks as noted in Section 3.

| Prefix | Auth / scope | Main endpoints |
|--------|--------------|----------------|
| /api/public | None (uses API key) | POST /inquiry, POST /external/inquiries/single |
| /api/auth | Mixed | POST /register-company, POST /login; GET/PUT /me, PUT /me/profile, PUT /me/password (auth) |
| /api/leads | auth, role, company | POST, GET, PUT, PATCH bulk, POST import, POST /:id/convert, PATCH /:id/assign, DELETE |
| /api/lead-sources | auth, company | GET, POST |
| /api/branches | auth, role, company | POST, GET, etc. |
| /api/users | auth, role, company | POST, GET, PUT, DELETE |
| /api/deals | auth, company | POST, GET, PUT, DELETE, PUT /:id/stage |
| /api/dashboard | auth, company | GET /, /leads, /deals, /conversion |
| /api/super-admin | auth, requireRole(super_admin) | Companies, branches, users, leads, deals CRUD + stats |
| /api/reports | auth, role | GET revenue, deals-by-stage, lead-conversions, user-performance, deal-forecasting |
| /api/master | auth, role | POST, GET, PUT reorder, PUT /:id, DELETE |
| /api/crm | auth, company | customers, contacts, calls, meetings, todos, notes CRUD; GET customers/:id/360 |
| /api/notifications | auth, company | GET /, /unread, PUT /all-read, PUT /:id/read |
| /api/search | auth, company | GET / (global search) |
| /api/activities | auth, company | POST, GET /lead/:leadId, GET /timeline (Lead, Deal, Customer, Contact timelines) |
| /api/audit-logs | auth, role | GET / (tenant-isolated; Super Admin can filter by companyId; pagination, objectType, startDate, endDate) |
| /api/automation | auth, company | GET, POST, PUT /:id, DELETE /:id |
| /api/inquiries | auth, company | POST, GET, POST /:id/convert, PUT /:id/status, DELETE /:id |
| /api/messages | auth, company | POST, GET |
| /api/tasks | auth, company | POST, GET, PATCH /:id |
| /api/pipelines | auth, company | GET /, GET /:pipelineId/stages, POST /, POST /stages |
| /api/targets | auth (role in controller) | GET team, GET my, GET /, POST, DELETE /:id |
| /api/branch-analytics | auth, company | GET /, /leaderboard, GET /auto-assign/status, POST /auto-assign/redistribute |
| /api/planner | auth | GET /today, GET /stats |

---

## 6. Data Models (MongoDB / Mongoose)

| Model | Purpose |
|-------|---------|
| User | name, email, password, role, companyId, branchId, status, lastAssignedAt |
| Company | name, email, phone, website, industry, address, status |
| Branch | name, address, companyId, status |
| Lead | name, email, phone, companyName, industry, status, source/sourceId, value, score, priority, notes, city, address, course, location, inquiryStatus, companyId, branchId, assignedTo, createdBy, isDeleted, isConverted, convertedAt |
| Deal | title, value, stage, pipelineId, stageId, lostReason, expectedCloseDate, customerId, contactId, leadId, companyId, branchId, assignedTo, createdBy |
| Inquiry | name, email, phone, companyName, message, value, source/sourceId, website, city, address, course, location, inquiryStatus, status (Open/Converted/Ignored), companyId, branchId |
| Customer | name, email, phone, website, industry, billing/shipping address, companyId, branchId, createdBy |
| Contact | name, email, phone, designation, customerId, department, buyingRole, assignedTo, companyId, branchId, createdBy |
| Pipeline | name, description, isActive, companyId, createdBy |
| Stage | name, pipelineId, order, probability, isSystem, winLikelihood, companyId, createdBy |
| LeadSource | name, type, isActive, companyId, createdBy |
| Activity | leadId, dealId, customerId, contactId, userId, type, note, previousStage, newStage, companyId (types: call, email, meeting, note, system, lead, lead_assigned, lead_qualified, status_change, deal, deal_stage_changed, customer, contact, task, message) |
| AuditLog | userId, action (create\|update\|delete), objectType, objectId, companyId, branchId, changes, description, metadata (ip, userAgent), createdAt |
| Call, Meeting, Todo, Note | CRM activity types (linked to lead/customer/deal) |
| Task | Separate task model for task routes |
| Message | Messaging |
| Notification | userId, companyId, type, title, message, metadata, isRead |
| AutomationRule | companyId, name, trigger, conditions, actions [], status, createdBy |
| MasterData | name, description, status, type (lead_source, lead_status, industry, …), companyId, createdBy, order |
| Target | setBy, assignedTo, companyId, branchId, month, year, revenueTarget, leadsTarget, dealsTarget, callsTarget, meetingsTarget, notes |

---

## 7. Step-by-Step User Flows

### 7.1 Login and Role Home

1. User opens app → root `/` runs SmartRedirect.
2. If any role has valid session (token + user in localStorage for that role) → redirect to `ROLE_HOME[role]`.
3. Else → redirect to `/login`.
4. User submits email/password in LoginForm → `POST /api/auth/login`.
5. Backend validates credentials, checks `status === "active"`, returns JWT and user (id, role, companyId, branchId).
6. Frontend calls `login(token, user)` → stores in role-specific keys; redirects to `ROLE_HOME[user.role]`.
7. Protected routes use SessionGuard: path determines role → guard checks that role’s token/user; if missing → redirect to `/login`.

### 7.2 Public Inquiry (External Form → Inquiry)

1. External site (e.g. WordPress) sends `POST /api/public/inquiry` or `POST /api/public/external/inquiries/single` with header `x-api-key: <companyId>` and body (name, email, phone, message, source, website, etc.).
2. Backend validates company and creates **Inquiry** (or finds existing lead by email/phone and appends to notes).
3. Inquiry appears in Inquiries list for that company (internal users).

### 7.3 Inquiry → Lead (Convert)

1. User opens Inquiries (e.g. /company/inquiries), selects an inquiry, clicks “Convert”.
2. Frontend calls `POST /api/inquiries/:id/convert` (body may include `assignedTo` or null for auto-assign).
3. Backend: load inquiry; ensure status ≠ Converted; create **Lead** from inquiry fields; if no assignedTo, run **assignLeadAutomatically** (round-robin by lastAssignedAt); run **calculateLeadScore**; set inquiry.status = Converted; create notification for assignee; log Activity.
4. Lead appears in Leads list; assignee sees notification.

### 7.4 Lead → Deal (Convert to Deal)

1. User opens Leads, selects lead, “Convert to deal”.
2. Frontend calls `POST /api/leads/:id/convert`.
3. Backend: load lead (company/branch/assignedTo scope); if already converted, reject; create **Customer** and **Contact** from lead; create **Deal** (title from lead, value, stage e.g. "New", leadId, customerId, contactId, companyId, branchId, assignedTo, createdBy); set lead.isConverted = true, lead.status = "Won"; log Activity; run automation trigger `deal_created`.
4. Deal appears in Deals and Pipeline; lead is marked converted.

### 7.5 Lead Status “Won” (No Deal)

1. User updates lead status to “Won” via `PUT /api/leads/:id`.
2. If new status is “Won” and lead was not already won and not yet converted: backend creates **Customer** and **Contact**, sets lead.isConverted = true. No deal is created.

### 7.6 Deal Stage Update (Pipeline)

1. User moves deal on pipeline UI or edits deal and sets new stage.
2. Frontend calls `PUT /api/deals/:id/stage` (or deal update with stageId).
3. Backend loads deal (company/branch/assignedTo), resolves stageId to stage name, updates deal; can trigger automation (e.g. deal_stage_changed).

### 7.7 New Lead Creation and Automation

1. User creates lead via `POST /api/leads` (or via inquiry convert).
2. Backend: duplicate check by email/phone; create Lead; if no assignedTo, **assignLeadAutomatically**; **calculateLeadScore**; log Activity; **runAutomation("lead_created", companyId, context)**.
3. Automation engine loads rules for trigger `lead_created`, evaluates conditions, runs actions (assign_to_branch, assign_to_user, create_notification, create_task, etc.).

### 7.8 Notifications

1. Notifications are created when: inquiry convert (assignee), lead assign, automation action create_notification.
2. User fetches `GET /api/notifications` or `/unread`, marks read via `PUT /:id/read` or `PUT /all-read`.

---

## 8. Automation Engine

- **Entry:** `runAutomation(triggerName, companyId, context)` in `utils/automationEngine.js`.
- **Triggers:** lead_created, lead_assigned, lead_qualified, deal_created, deal_stage_changed, task_overdue, meeting_scheduled.
- **Process:** Load **AutomationRule** for trigger and status active; evaluate conditions (exact match on context); for each action run **executeAction**.
- **Actions:** assign_to_branch, assign_to_user, create_notification, create_task, send_email, update_lead_score, move_pipeline_stage (params.stageId to move deal to a stage).

---

## 9. Notifications

- **notificationService.createNotification({ userId, companyId, title, message, type, link })** creates **Notification** (isRead: false).
- Used on: inquiry→lead assign, lead assign, and automation create_notification.

---

## 10. Public / Integration API

- **Public inquiry:** `POST /api/public/inquiry` (and external alias) with `x-api-key` = companyId. CORS allows configured origins (and localhost in dev).
- **Lead scoring:** `leadManagement.calculateLeadScore` uses source weight, profile completeness, call/meeting counts → sets lead score and priority.
- **Round-robin assignment:** `assignLeadAutomatically(leadId, companyId, branchId)` picks sales user in branch (or company) by `lastAssignedAt` and updates it.

---

## 11. Security and Errors

- **CORS:** Configurable via `FRONTEND_URL` and `ALLOWED_ORIGINS`; localhost allowed in development.
- **Helmet:** Enabled for security headers.
- **Rate limit:** Login 100/15 min per IP; **global API** 500/15 min per IP for `/api/*` (override via `API_RATE_LIMIT_MAX`).
- **Audit:** Lead/Deal create, update, delete write to **AuditLog** via `createAuditEntry` in `utils/auditLogger.js` (userId, action, objectType, objectId, companyId, changes, req for ip/userAgent).
- **Error handler:** 500 handler logs error and returns `{ success: false, message }` (stack in development).

---

## 12. Summary Diagram (Flow)

```
[User] → /login → POST /api/auth/login → JWT + user
         → login(token, user) → redirect to ROLE_HOME[role]
         → SessionGuard + Layout → Dashboard / Leads / Deals / …

[External] → POST /api/public/inquiry (x-api-key) → Inquiry
[User]     → Inquiries → Convert → POST /api/inquiries/:id/convert → Lead (+ optional auto-assign, score, notification)
[User]     → Leads → Convert to deal → POST /api/leads/:id/convert → Customer + Contact + Deal, lead converted
[User]     → Pipeline → PUT /api/deals/:id/stage → Deal stage updated (automation optional)
[System]   → lead_created / deal_created → runAutomation → conditions → actions (assign, notify, task)
[User]     → GET /api/notifications, PUT …/read → In-app notifications
```

---

This file is the single reference for **process and flow** of the CRM. Update it when adding or changing routes, roles, APIs, or flows.

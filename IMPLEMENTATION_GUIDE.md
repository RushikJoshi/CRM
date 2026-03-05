# 🚀 Enterprise CRM - Implementation Guide

## Overview

Your CRM system now has a complete enterprise architecture with proper role-based hierarchy and data isolation. This guide shows you how to implement the frontend pages and connect to the backend APIs.

---

## Current Status

### ✅ Already Implemented
1. **Database Models** - All models with relationships
2. **Authentication** - JWT with role system
3. **Role-Based Access** - Super Admin, Company Admin, Branch Manager, Sales
4. **Data Isolation** - By company, branch, and user
5. **Dashboard UI** - Professional layout with sidebar
6. **Basic Pages** - Companies, Branches, Users, Leads, Customers, Deals, etc.

### 🔧 Quick Implementation Checklist

---

## 1. Leads Management Page

### Requirements
- List view with filters and search
- Edit lead modal
- Convert lead to customer
- Assign lead to sales user
- Activity timeline

### Key Features to Implement

#### List View
```jsx
// Company Admin sees all branch leads
// Branch Manager sees branch leads only
// Sales User sees only assigned leads

GET /api/leads?companyId={}&branchId={}&ownerId={}
```

#### Convert Lead to Customer
```jsx
// When converting a lead:
// 1. Create Customer from lead data
// 2. Create primary Contact
// 3. Create Deal opportunity
// 4. Mark lead as isConverted = true

PUT /api/leads/:id/convert
{
  customerName,
  customerEmail,
  contactName,
  contactDesignation,
  dealTitle,
  dealValue
}
```

#### Assign Lead to Sales User
```jsx
PUT /api/leads/:id/assign
{
  ownerId: selectedSalesUserId
}
```

---

## 2. Deal Kanban Board

### Implementation Steps

```jsx
// 1. Fetch all deals grouped by stage
GET /api/deals?companyId={}&branchId={}&grouped=true

// Response:
{
  "New Lead": [deal1, deal2],
  "Qualified": [deal3, deal4],
  "Proposal": [deal5],
  "Negotiation": [],
  "Won": [deal6],
  "Lost": [deal7]
}

// 2. Implement drag-drop
- Use react-beautiful-dnd or similar library
- On drop, update deal stage

// 3. Update when dropped
PUT /api/deals/:id/stage
{
  stage: "Proposal"  // New stage
}

// 4. Show deal details on click
- Deal title, amount, customer, contact
- Activities/timeline
- Edit button
```

### Kanban Card Component
```jsx
<DealCard deal={deal}>
  <h3>{deal.title}</h3>
  <p>💰 ${deal.value}</p>
  <p>👤 {deal.customer?.name}</p>
  <p>📅 {deal.expectedCloseDate}</p>
  <p>👨‍💼 {deal.owner?.name}</p>
</DealCard>
```

---

## 3. Activity Timeline

### Components Needed

```jsx
// Lead Page with Timeline
<Lead>
  <LeadDetails/>
  <ActivityTimeline leadId={lead._id}>
    {activities.map(activity => (
      <TimelineItem activity={activity} />
    ))}
  </ActivityTimeline>
</Lead>

// Timeline Item Types:
- Call: 📞 Called {contact} - 2 hours ago
- Meeting: 📅 Meeting with {attendees} - Yesterday
- Task: ✓ Completed {taskTitle} - 3 days ago
- Status Change: 🔄 Lead status changed from Contacted to Qualified
- Note: 📝 Added note: "{note}"
- Deal: 🏆 Created deal "{dealTitle}"
```

### API Endpoint
```javascript
GET /api/leads/:id/activities
// Returns combined timeline of:
// - Calls
// - Meetings
// - Tasks
// - Status changes
// - Notes
```

---

## 4. Role-Based Dashboard

### Super Admin Dashboard
```jsx
<Dashboard>
  <h2>Platform Overview</h2>
  
  <StatCards>
    <Card>
      <h4>Total Companies</h4>
      <p className="text-3xl">{companies.length}</p>
      <p className="text-gray-500">+12% from last month</p>
    </Card>
    <Card>
      <h4>Total Users</h4>
      <p className="text-3xl">{users.length}</p>
    </Card>
    <Card>
      <h4>Total Revenue</h4>
      <p className="text-3xl">${totalRevenue}</p>
    </Card>
    <Card>
      <h4>Total Deals</h4>
      <p className="text-3xl">{deals.length}</p>
    </Card>
  </StatCards>
  
  <RecentCompanies/>
  <RevenueChart/>
</Dashboard>
```

### Company Admin Dashboard
```jsx
<Dashboard>
  <h2>{company?.name} - Admin Dashboard</h2>
  
  <StatCards>
    <Card>Total Branches - {branches.length}</Card>
    <Card>Active Users - {activeUsers.length}</Card>
    <Card>Total Leads - {leads.length}</Card>
    <Card>Total Deals - {deals.length}</Card>
    <Card>Revenue (This Month) - ${monthlyRevenue}</Card>
  </StatCards>
  
  <BranchPerformance branches={branches}/>
  <LeadPipeline leads={leads}/>
  <SalesPerformance users={users}/>
  <RecentActivities/>
</Dashboard>
```

### Branch Manager Dashboard
```jsx
<Dashboard>
  <h2>Branch Dashboard - {branch?.name}</h2>
  
  <StatCards>
    <Card>Branch Users - {users.length}</Card>
    <Card>Active Leads - {activeLeads.length}</Card>
    <Card>Pipeline - ${pipelineValue}</Card>
    <Card>Conversion Rate - {conversionRate}%</Card>
  </StatCards>
  
  <SalesTeamPerformance users={users}/>
  <LeadPipeline leads={leads}/>
  <DealsForecast deals={deals}/>
  <TeamActivities/>
</Dashboard>
```

### Sales User Dashboard
```jsx
<Dashboard>
  <h2>My Dashboard</h2>
  
  <StatCards>
    <Card>My Leads - {myLeads.length}</Card>
    <Card>My Deals - {myDeals.length}</Card>
    <Card>Today's Calls - {todaysCalls.length}</Card>
    <Card>Today's Tasks - {todaysTasks.length}</Card>
  </StatCards>
  
  <MyLeadsPipeline leads={myLeads}/>
  <MyDealsForecast deals={myDeals}/>
  <TodaysActivities/>
  <UpcomingTasks/>
  <ForecastChart deals={myDeals}/>
</Dashboard>
```

---

## 5. Master Data Configuration

### What Company Admins Can Configure
```
Lead Sources:
  - Website
  - Email
  - Phone
  - Social Media
  - Referral
  - Event

Lead Statuses:
  - New
  - Contacted
  - Qualified
  - Proposal
  - Negotiation
  - Closed Won
  - Closed Lost

Departments:
  - Sales
  - IT
  - HR
  - Finance
  - Operations

Industries:
  - Technology
  - Finance
  - Healthcare
  - Retail
  - Manufacturing

Email Categories:
  - Work
  - Personal
  - Other

Buying Roles:
  - Decision Maker
  - Influencer
  - User
  - Gatekeeper

Outcomes:
  - Positive
  - Neutral
  - Negative
```

### API Implementation
```jsx
GET /api/master/lead-sources     // Get all lead sources
POST /api/master/lead-sources    // Create new source
PUT /api/master/:id              // Update
DELETE /api/master/:id           // Delete

// Filter by company during get/create/update
```

---

## 6. User Management per Role

### Super Admin
- View all users across all companies
- Create company admins
- View user activities

### Company Admin
- Create branch managers
- Create sales users
- Assign users to branches
- View all user activities
- Deactivate users

### Branch Manager
- View branch users
- Cannot create users (only company admin can)
- See user performance
- Assign leads to sales users

---

## 7. Advanced Features

### Reporting
```jsx
GETapiReports/company-overview
GET /api/reports/branch-performance
GET /api/reports/sales-pipeline
GET /api/reports/revenue
GET /api/reports/conversion-metrics
```

### Search & Filter
```jsx
// Leads Search
GET /api/leads?search=john&status=qualified&source=website&branch=xyz

// Deals Search
GET /api/deals?search=acme&stage=proposal&owner=sales-user-id

// Customers Search
GET /api/customers?search=tech&industry=technology
```

### Notifications
```jsx
// Push notifications for:
- Lead assigned to you
- Deal stage changed
- Meeting reminder
- Task due date approaching
```

### Activity Feed
```jsx
// Show all recent activities:
- Who created/updated what
- When
- What changed
```

---

## 8. Frontend Architecture Recommendation

### Component Structure
```
src/
├── pages/
│   ├── Dashboard.jsx           ✅ Role-based
│   ├── Leads.jsx               📋 List, Filter, Modal, Timeline
│   ├── Leads/
│   │   ├── LeadList.jsx
│   │   ├── LeadDetail.jsx
│   │   ├── ConvertLeadModal.jsx
│   │   └── ActivityTimeline.jsx
│   ├── Deals.jsx               🎯 Kanban Board
│   ├── Deals/
│   │   ├── KanbanBoard.jsx
│   │   ├── DealCard.jsx
│   │   └── DealModal.jsx
│   ├── Customers.jsx
│   ├── Contacts.jsx
│   ├── Activities/
│   │   ├── Calls.jsx
│   │   ├── Meetings.jsx
│   │   ├── Tasks.jsx
│   │   └── Calendar.jsx
│   ├── Master.jsx              ⚙️ Master Data Config
│   ├── Branches.jsx            🏢 Branch Management
│   ├── Users.jsx               👥 User Management
│   ├── Reports.jsx             📊 Analytics & Reports
│   └── Settings.jsx
├── components/
│   ├── Layout.jsx              ✅
│   ├── Sidebar.jsx             ✅
│   ├── Navbar.jsx              ✅
│   ├── DataTable.jsx           🔲 Reusable table component
│   ├── KanbanBoard.jsx         🎯 Reusable kanban
│   ├── Timeline.jsx            📅 Activity timeline
│   ├── Modal.jsx               💬 Reusable modal
│   └── ...other components
├── hooks/
│   ├── useApi.js               API calls
│   ├── useAuth.js              Auth context
│   ├── usePagination.js        Pagination logic
│   └── useFilter.js            Filter logic
└── services/
    ├── api.js                  ✅ Axios instance
    ├── leadService.js          Lead API calls
    ├── dealService.js          Deal API calls
    └── ...other services
```

---

## 9. Quick Start: Implementing Leads Page

### Step 1: Create Leads Service
```javascript
// src/services/leadService.js
import API from "./api";

export const leadService = {
  async getLeads(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return API.get(`/leads?${params}`);
  },
  
  async getLead(id) {
    return API.get(`/leads/${id}`);
  },
  
  async createLead(data) {
    return API.post("/leads", data);
  },
  
  async updateLead(id, data) {
    return API.put(`/leads/${id}`, data);
  },
  
  async assignLead(id, ownerId) {
    return API.put(`/leads/${id}/assign`, { ownerId });
  },
  
  async convertLead(id, conversionData) {
    return API.put(`/leads/${id}/convert`, conversionData);
  },
  
  async getLeadActivities(id) {
    return API.get(`/leads/${id}/activities`);
  },
  
  async deleteLead(id) {
    return API.delete(`/leads/${id}`);
  }
};
```

### Step 2: Create Leads Page Component
```jsx
// src/pages/Leads.jsx
import { useState, useEffect } from "react";
import { leadService } from "../services/leadService";
import Layout from "../components/Layout";
import DataTable from "../components/DataTable";
import LeadDetailModal from "../components/modals/LeadDetailModal";

function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filters, setFilters] = useState({});
  
  useEffect(() => {
    fetchLeads();
  }, [filters]);
  
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await leadService.getLeads(filters);
      setLeads(res.data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const columns = [
    { key: "name", label: "Lead Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "companyName", label: "company" },
    { key: "status", label: "Status" },
    { key: "source", label: "Source" },
    { key: "ownerId", label: "Owner" },
    { key: "actions", label: "Actions" }
  ];
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Leads</h1>
      
      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="px-4 py-2 border rounded"
        />
        {/* More filters */}
      </div>
      
      {/* Table */}
      <DataTable
        columns={columns}
        data={leads}
        loading={loading}
        onRowClick={(lead) => setSelectedLead(lead)}
        actions={[
          { label: "Edit", onClick: (lead) => setSelectedLead(lead) },
          { label: "Assign", onClick: (lead) => assignLead(lead) },
          { label: "Convert", onClick: (lead) => convertLead(lead) }
        ]}
      />
      
      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={fetchLeads}
        />
      )}
    </div>
  );
}

export default Leads;
```

---

## 10. Backend Controller Template

### Leads Controller Example
```javascript
// backend/controllers/leadController.js

// Get leads with proper filtering
exports.getLeads = async (req, res) => {
  try {
    const { search, status, source, owner, page = 1, limit = 20 } = req.query;
    const user = req.user;
    
    // Build filter based on user role
    let filter = { isDeleted: false };
    
    if (user.role === "super_admin") {
      // Super admin sees all leads
    } else if (user.role === "company_admin") {
      filter.companyId = user.companyId;
    } else if (user.role === "branch_manager") {
      filter.companyId = user.companyId;
      filter.branchId = user.branchId;
    } else if (user.role === "sales") {
      filter.companyId = user.companyId;
      filter.branchId = user.branchId;
      filter.ownerId = user._id;
    }
    
    // Apply search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }
    
    // Apply other filters
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (owner) filter.ownerId = owner;
    
    const leads = await Lead.find(filter)
      .populate("status source ownerId createdBy")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Lead.countDocuments(filter);
    
    res.json({
      success: true,
      data: leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Convert lead to customer
exports.convertLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, contactName, dealTitle, dealValue } = req.body;
    const user = req.user;
    
    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    
    // Create Customer
    const customer = new Customer({
      name: customerName,
      email: lead.email,
      phone: lead.phone,
      companyId: lead.companyId,
      branchId: lead.branchId,
      createdBy: user._id,
      convertedFrom: lead._id
    });
    await customer.save();
    
    // Create Contact
    const contact = new Contact({
      name: contactName,
      email: lead.email,
      phone: lead.phone,
      customerId: customer._id,
      companyId: lead.companyId,
      branchId: lead.branchId,
      createdBy: user._id
    });
    await contact.save();
    
    // Create Deal
    const deal = new Deal({
      title: dealTitle,
      value: dealValue,
      stage: "New Lead",
      customerId: customer._id,
      contactId: contact._id,
      leadId: lead._id,
      companyId: lead.companyId,
      branchId: lead.branchId,
      ownerId: lead.ownerId,
      createdBy: user._id
    });
    await deal.save();
    
    // Update lead
    lead.isConverted = true;
    lead.convertedTo = customer._id;
    await lead.save();
    
    res.json({
      success: true,
      message: "Lead converted to customer successfully",
      data: {
        customer,
        contact,
        deal
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

## 🎯 Priorities

1. **HIGH** - Implement proper lead management
2. **HIGH** - Deal Kanban board
3. **MEDIUM** - Activity timeline for leads/customers
4. **MEDIUM** - Master data configuration
5. **LOW** - Advanced reporting
6. **LOW** - Email integration

---

**Your enterprise CRM is now fully architected and ready for implementation!**

For detailed implementation, refer to `CRM_ARCHITECTURE.md`

Generated: March 4, 2026

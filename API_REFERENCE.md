# 📡 Enterprise CRM API Reference Guide

## Authentication

### Login (Public Endpoint)
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "john@techdiv.in",
  "password": "password123"
}

Response 200:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Sales",
    "email": "john@techdiv.in",
    "role": "sales",           // super_admin, company_admin, branch_manager, sales
    "companyId": "507f1f77bcf86cd799439012",
    "branchId": "507f1f77bcf86cd799439013",
    "phone": "+91-9999999999",
    "status": "active"
  }
}

Response 401:
{
  "success": false,
  "error": "Invalid email or password"
}
```

### Refresh Token
```
POST /api/auth/refresh
Headers: Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "token": "new_jwt_token"
}
```

---

## Super Admin Endpoints

### List All Companies
```
GET /api/super-admin/companies
Headers: Authorization: Bearer <TOKEN>
Query Params: ?page=1&limit=20

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Gitakshmi Pvt Ltd",
      "email": "admin@gitakshmi.com",
      "phone": "+91-7949999999",
      "website": "www.gitakshmi.com",
      "industry": "Technology",
      "status": "active",
      "companyAdmin": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Company Admin Name",
        "email": "admin@gitakshmi.com"
      },
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-03-04T15:45:00Z"
    },
    ... more companies
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}

Response 403:
{
  "success": false,
  "error": "Unauthorized - Super Admin access required"
}
```

### Create Company (Auto-creates Company Admin with email as username)
```
POST /api/super-admin/companies
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "name": "Acme Corporation",
  "email": "admin@acmecorp.com",
  "phone": "+1-555-0001",
  "website": "www.acmecorp.com",
  "industry": "Manufacturing",
  "currency": "USD",
  "timezone": "America/New_York"
}

Response 201:
{
  "success": true,
  "message": "Company created successfully. Company Admin user created.",
  "data": {
    "company": {
      "_id": "507f1f77bcf86cd799439090",
      "name": "Acme Corporation",
      "email": "admin@acmecorp.com",
      "phone": "+1-555-0001",
      "companyAdmin": "507f1f77bcf86cd799439091",
      "status": "active",
      "createdAt": "2026-03-04T16:00:00Z"
    },
    "companyAdmin": {
      "_id": "507f1f77bcf86cd799439091",
      "name": "admin@acmecorp.com",
      "email": "admin@acmecorp.com",
      "role": "company_admin",
      "companyId": "507f1f77bcf86cd799439090",
      "status": "active",
      "defaultPassword": true    // Flag to change on first login
    }
  }
}

Response 400:
{
  "success": false,
  "error": "Company with this email already exists"
}
```

### Get Company Details
```
GET /api/super-admin/companies/{companyId}
Headers: Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Gitakshmi Pvt Ltd",
    "email": "admin@gitakshmi.com",
    "phone": "+91-7949999999",
    "website": "www.gitakshmi.com",
    "industry": "Technology",
    "status": "active",
    "companyAdmin": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Rajesh Kumar",
      "email": "rajesh@gitakshmi.com"
    },
    "settings": {
      "currency": "INR",
      "timezone": "Asia/Kolkata",
      "fiscalYearStart": "04-01"
    },
    "stats": {
      "totalBranches": 3,
      "totalUsers": 25,
      "totalLeads": 156,
      "totalCustomers": 45,
      "totalDeals": 32,
      "revenue": 2500000
    },
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

### Platform Dashboard
```
GET /api/super-admin/dashboard
Headers: Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "data": {
    "overview": {
      "totalCompanies": 15,
      "totalActiveUsers": 234,
      "totalLeads": 3456,
      "totalDeals": 567,
      "totalRevenue": 45000000,
      "contractValue": 78900000
    },
    "topCompanies": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Gitakshmi Pvt Ltd",
        "revenue": 2500000,
        "deals": 32
      },
      ... more companies
    ],
    "leadTrend": [
      { "month": "Jan", "count": 234 },
      { "month": "Feb", "count": 245 },
      { "month": "Mar", "count": 289 }
    ],
    "revenueTrend": [
      { "month": "Jan", "amount": 2000000 },
      { "month": "Feb", "amount": 2100000 },
      { "month": "Mar", "amount": 2300000 }
    ]
  }
}
```

---

## Company Admin Endpoints

### Create Branch
```
POST /api/branches
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "name": "Mumbai Branch",
  "location": "Mumbai, India",
  "phone": "+91-9999888888",
  "address": "123 Business Center, Mumbai"
}

Note: companyId is automatically filled from authenticated user

Response 201:
{
  "success": true,
  "message": "Branch created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Mumbai Branch",
    "companyId": "507f1f77bcf86cd799439012",
    "location": "Mumbai, India",
    "phone": "+91-9999888888",
    "address": "123 Business Center, Mumbai",
    "branchManager": null,
    "status": "active",
    "createdAt": "2026-03-04T16:10:00Z"
  }
}
```

### List Branches
```
GET /api/branches
GET /api/branches?page=1&limit=10
Headers: Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Mumbai Branch",
      "companyId": "507f1f77bcf86cd799439012",
      "location": "Mumbai, India",
      "phone": "+91-9999888888",
      "branchManager": {
        "_id": "507f1f77bcf86cd799439030",
        "name": "Priya Patel",
        "email": "priya@gitakshmi.com"
      },
      "stats": {
        "totalUsers": 8,
        "totalLeads": 45,
        "totalDeals": 12,
        "revenue": 1200000
      },
      "status": "active",
      "createdAt": "2026-03-04T16:10:00Z"
    },
    ... more branches
  ],
  "pagination": { ... }
}
```

### Assign Branch Manager
```
PUT /api/branches/{branchId}/assign-manager
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "userId": "507f1f77bcf86cd799439030"  // User ID of branch manager
}

Response 200:
{
  "success": true,
  "message": "Branch manager assigned successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Mumbai Branch",
    "branchManager": {
      "_id": "507f1f77bcf86cd799439030",
      "name": "Priya Patel",
      "email": "priya@gitakshmi.com",
      "role": "branch_manager"
    }
  }
}
```

### Create User
```
POST /api/users
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "name": "Raj Singh",
  "email": "raj@gitakshmi.com",
  "role": "sales",           // sales | branch_manager
  "branchId": "507f1f77bcf86cd799439020",
  "phone": "+91-9999877777",
  "department": "507f1f77bcf86cd799439050"  // ObjectId of department master data
}

Note: System auto-generates temporary password and sends via email

Response 201:
{
  "success": true,
  "message": "User created successfully. Temporary password sent to email.",
  "data": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "Raj Singh",
    "email": "raj@gitakshmi.com",
    "role": "sales",
    "companyId": "507f1f77bcf86cd799439012",
    "branchId": "507f1f77bcf86cd799439020",
    "phone": "+91-9999877777",
    "status": "active",
    "createdAt": "2026-03-04T16:15:00Z"
  }
}
```

### Master Data Configuration
```
GET /api/master/lead-sources
GET /api/master/lead-statuses
GET /api/master/departments
GET /api/master/industries
GET /api/master/email-categories
GET /api/master/buying-roles
GET /api/master/outcomes

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "type": "lead_source",
      "value": "website",
      "label": "Website",
      "sequence": 1,
      "isActive": true,
      "companyId": "507f1f77bcf86cd799439012"
    },
    {
      "_id": "507f1f77bcf86cd799439051",
      "type": "lead_source",
      "value": "email",
      "label": "Email Campaign",
      "sequence": 2,
      "isActive": true
    },
    ... more items
  ]
}
```

### Create Master Data Item
```
POST /api/master/lead-sources
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "label": "LinkedIn",
  "sequence": 5
}

Response 201:
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439052",
    "type": "lead_source",
    "value": "linkedin",
    "label": "LinkedIn",
    "sequence": 5,
    "isActive": true,
    "companyId": "507f1f77bcf86cd799439012",
    "createdAt": "2026-03-04T16:20:00Z"
  }
}
```

---

## Branch Manager / Sales User Endpoints

### List Leads (With Filtering)
```
GET /api/leads
GET /api/leads?search=john&status=507f1f77bcf86cd799439060&owner=507f1f77bcf86cd799439031&page=1&limit=20
Headers: Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439070",
      "name": "John Doe", 
      "email": "john@acmecorp.com",
      "phone": "+1-555-0100",
      "companyName": "Acme Corp",
      "industry": {
        "_id": "507f1f77bcf86cd799439040",
        "label": "Manufacturing"
      },
      "source": {
        "_id": "507f1f77bcf86cd799439050",
        "label": "Website"
      },
      "status": {
        "_id": "507f1f77bcf86cd799439060",
        "label": "Contacted"
      },
      "leadValue": 50000,
      "priority": "high",
      "notes": "Interested in enterprise plan",
      "owner": {
        "_id": "507f1f77bcf86cd799439031",
        "name": "Raj Singh",
        "email": "raj@gitakshmi.com"
      },
      "isConverted": false,
      "lastContacted": "2026-03-01T10:30:00Z",
      "nextFollowUp": "2026-03-05T14:00:00Z",
      "createdAt": "2026-02-15T09:00:00Z"
    },
    ... more leads
  ],
  "pagination": { ... }
}

Note: Sales users see only their assigned leads (ownerId filter auto-applied)
Branch managers see all branch leads
Company admins see all company leads
```

### Create Lead
```
POST /api/leads
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "name": "Jane Smith",
  "email": "jane@techcorp.com",
  "phone": "+1-555-0200",
  "companyName": "Tech Corp",
  "industry": "507f1f77bcf86cd799439040",  // Industry master data ID
  "source": "507f1f77bcf86cd799439050",    // Source master data ID
  "status": "507f1f77bcf86cd799439061",    // Status master data ID (usually "New")
  "leadValue": 75000,
  "priority": "medium",
  "notes": "CEO wants meeting next week"
}

Response 201:
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439071",
    "name": "Jane Smith",
    "email": "jane@techcorp.com",
    ... all lead fields ...
    "owner": {                         // Auto-assigned to current user
      "_id": "507f1f77bcf86cd799439031",
      "name": "Raj Singh"
    },
    "createdAt": "2026-03-04T16:25:00Z"
  }
}
```

### Assign Lead to Sales User (Branch Manager only)
```
PUT /api/leads/{leadId}/assign
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "ownerId": "507f1f77bcf86cd799439032"  // User ID of sales person
}

Response 200:
{
  "success": true,
  "message": "Lead assigned to Rajesh Kumar successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439070",
    "name": "John Doe",
    "owner": {
      "_id": "507f1f77bcf86cd799439032",
      "name": "Rajesh Kumar",
      "email": "rajesh@gitakshmi.com"
    }
  }
}
```

### Convert Lead to Customer
```
PUT /api/leads/{leadId}/convert
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "customerName": "John Doe Enterprises",
  "customerEmail": "john@johnenterprises.com",
  "contactName": "John Doe",
  "contactDesignation": "CEO",
  "dealTitle": "Enterprise License - Year 1",
  "dealValue": 50000,
  "dealExpectedCloseDate": "2026-04-30"
}

Response 200:
{
  "success": true,
  "message": "Lead converted to customer successfully",
  "data": {
    "lead": {
      "_id": "507f1f77bcf86cd799439070",
      "isConverted": true,
      "convertedTo": "507f1f77bcf86cd799439080"
    },
    "customer": {
      "_id": "507f1f77bcf86cd799439080",
      "name": "John Doe Enterprises",
      "email": "john@johnenterprises.com",
      "phone": "+1-555-0100",
      "industry": "Manufacturing",
      "convertedFrom": "507f1f77bcf86cd799439070",
      "createdAt": "2026-03-04T16:30:00Z"
    },
    "contact": {
      "_id": "507f1f77bcf86cd799439081",
      "name": "John Doe",
      "email": "john@johnenterprises.com",
      "designation": "CEO",
      "customerId": "507f1f77bcf86cd799439080",
      "isPrimary": true
    },
    "deal": {
      "_id": "507f1f77bcf86cd799439082",
      "title": "Enterprise License - Year 1",
      "value": 50000,
      "stage": "New Lead",
      "customerId": "507f1f77bcf86cd799439080",
      "contactId": "507f1f77bcf86cd799439081",
      "leadId": "507f1f77bcf86cd799439070",
      "expectedCloseDate": "2026-04-30"
    }
  }
}
```

### Get Lead Activities Timeline
```
GET /api/leads/{leadId}/activities
Headers: Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439100",
      "type": "lead_created",
      "timestamp": "2026-02-15T09:00:00Z",
      "description": "Lead created",
      "createdBy": {
        "name": "Raj Singh",
        "email": "raj@gitakshmi.com"
      }
    },
    {
      "_id": "507f1f77bcf86cd799439101",
      "type": "call",
      "title": "Initial Contact Call",
      "timestamp": "2026-02-18T14:30:00Z",
      "duration": 15,       // minutes
      "result": "Completed",
      "notes": "Discussed requirements, very interested",
      "createdBy": {
        "name": "Raj Singh"
      }
    },
    {
      "_id": "507f1f77bcf86cd799439102",
      "type": "status_change",
      "timestamp": "2026-02-20T10:00:00Z",
      "description": "Lead status changed from 'Contacted' to 'Qualified'",
      "oldStatus": "Contacted",
      "newStatus": "Qualified"
    },
    {
      "_id": "507f1f77bcf86cd799439103",
      "type": "meeting",
      "title": "Product Demo",
      "timestamp": "2026-02-25T09:00:00Z",
      "participants": ["Raj Singh", "Priya Patel"],
      "meetingLink": "https://zoom.us/...",
      "status": "Done"
    },
    {
      "_id": "507f1f77bcf86cd799439104",
      "type": "note",
      "timestamp": "2026-03-01T15:45:00Z",
      "notes": "Client wants to see custom integrations"
    },
    {
      "_id": "507f1f77bcf86cd799439105",
      "type": "deal_created",
      "timestamp": "2026-03-02T10:15:00Z",
      "description": "Deal created: Enterprise License - Year 1",
      "dealId": "507f1f77bcf86cd799439082",
      "dealValue": 50000
    }
  ]
}
```

### List Deals (Kanban View)
```
GET /api/deals
GET /api/deals?grouped=true
Headers: Authorization: Bearer <TOKEN>

Response 200 (Grouped):
{
  "success": true,
  "data": {
    "New Lead": [
      {
        "_id": "507f1f77bcf86cd799439082",
        "title": "Enterprise License - Year 1",
        "value": 50000,
        "stage": "New Lead",
        "probability": 30,
        "customer": {
          "_id": "507f1f77bcf86cd799439080",
          "name": "John Doe Enterprises"
        },
        "contact": {
          "name": "John Doe"
        },
        "owner": {
          "name": "Raj Singh"
        },
        "expectedCloseDate": "2026-04-30"
      }
    ],
    "Qualified": [
      ... more deals
    ],
    "Proposal": [
      ... more deals
    ],
    "Negotiation": [],
    "Won": [
      {
        "_id": "507f1f77bcf86cd799439090",
        "title": "Premium Plan - 12 Months",
        "value": 120000,
        "stage": "Won",
        "actualCloseDate": "2026-02-28T18:00:00Z"
      }
    ],
    "Lost": []
  }
}
```

### Update Deal Stage (Kanban Drag-Drop)
```
PUT /api/deals/{dealId}/stage
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "stage": "Proposal"
}

Response 200:
{
  "success": true,
  "message": "Deal moved to Proposal stage",
  "data": {
    "_id": "507f1f77bcf86cd799439082",
    "title": "Enterprise License - Year 1",
    "stage": "Proposal",
    "updatedAt": "2026-03-04T16:35:00Z"
  }
}
```

### Create Call/Activity
```
POST /api/calls
Headers: Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "title": "Follow-up Call",
  "description": "Discussed pricing and timeline",
  "callType": "Outbound",
  "result": "Completed",
  "duration": 20,
  "leadId": "507f1f77bcf86cd799439070",
  "scheduledAt": "2026-03-04T14:30:00Z"
}

Response 201:
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439106",
    "title": "Follow-up Call",
    "leadId": "507f1f77bcf86cd799439070",
    "callType": "Outbound",
    "result": "Completed",
    "duration": 20,
    "owner": {
      "name": "Raj Singh"
    },
    "completedAt": "2026-03-04T14:50:00Z",
    "createdAt": "2026-03-04T16:35:00Z"
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "No token provided" or "Invalid token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Unauthorized - Required role: super_admin"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Lead not found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "name": "Name is required",
    "email": "Invalid email format"
  }
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Error details..."
}
```

---

## Notes

1. **Authentication**: Include `Authorization: Bearer <TOKEN>` in all protected endpoints
2. **Company/Branch Filtering**: Automatically applied based on user role
3. **Pagination**: Default limit=20, page=1
4. **Sorting**: Add `?sort=field` or `?sort=-field` (- for descending)
5. **Timestamps**: All timestamps in ISO 8601 format (UTC)
6. **Currency**: Use company-specific currency from settings
7. **Master Data**: All reference fields should use ObjectId from master data

---

## Testing with cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@techdiv.in","password":"password123"}'

# Get Leads
curl -X GET http://localhost:5000/api/leads \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create Lead
curl -X POST http://localhost:5000/api/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Jane Smith",
    "email":"jane@techcorp.com",
    "phone":"+1-555-0200",
    "companyName":"Tech Corp",
    "leadValue":75000
  }'
```

---

**Complete API reference with request/response examples!**

Generated: March 4, 2026

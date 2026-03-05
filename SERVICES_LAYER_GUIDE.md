# 🔧 Frontend Services Layer Implementation Guide

## Overview

The services layer is the bridge between React components and the backend API. Each service handles API calls for a specific domain (leads, deals, customers, etc.) and provides a clean interface for components.

---

## Base Service Setup

Create `src/services/baseService.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export class BaseService {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add JWT token interceptor
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 responses
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear auth and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  getList(params = {}) {
    return this.api.get('', { params });
  }

  getById(id) {
    return this.api.get(`/${id}`);
  }

  create(data) {
    return this.api.post('', data);
  }

  update(id, data) {
    return this.api.put(`/${id}`, data);
  }

  delete(id) {
    return this.api.delete(`/${id}`);
  }

  custom(method, url, data = null) {
    if (method === 'GET') {
      return this.api.get(url);
    }
    if (method === 'POST') {
      return this.api.post(url, data);
    }
    if (method === 'PUT') {
      return this.api.put(url, data);
    }
    if (method === 'DELETE') {
      return this.api.delete(url);
    }
  }
}
```

---

## Lead Service

Create `src/services/leadService.js`:

```javascript
import { BaseService } from './baseService';

class LeadService extends BaseService {
  constructor() {
    super('leads');
  }

  // Get all leads with filters
  getLeads(filters = {}) {
    return this.getList({
      search: filters.search,
      status: filters.status,
      source: filters.source,
      priority: filters.priority,
      owner: filters.owner,
      page: filters.page || 1,
      limit: filters.limit || 20,
      sort: filters.sort || '-createdAt',
    });
  }

  // Get single lead with activities
  getLead(id) {
    return this.getById(id);
  }

  // Get lead activities timeline
  getLeadActivities(leadId) {
    return this.custom('GET', `/${leadId}/activities`);
  }

  // Create new lead
  createLead(leadData) {
    return this.create(leadData);
  }

  // Update lead
  updateLead(id, leadData) {
    return this.update(id, leadData);
  }

  // Delete lead
  deleteLead(id) {
    return this.delete(id);
  }

  // Assign lead to user
  assignLead(leadId, userId) {
    return this.custom('PUT', `/${leadId}/assign`, { ownerId: userId });
  }

  // Convert lead to customer
  convertLead(leadId, conversionData) {
    return this.custom('PUT', `/${leadId}/convert`, conversionData);
  }

  // Bulk assign leads
  bulkAssignLeads(leadIds, userId) {
    return this.custom('PUT', '/bulk/assign', {
      leadIds,
      ownerId: userId,
    });
  }

  // Bulk update lead status
  bulkUpdateStatus(leadIds, statusId) {
    return this.custom('PUT', '/bulk/status', {
      leadIds,
      status: statusId,
    });
  }

  // Add note to lead
  addNote(leadId, note) {
    return this.custom('POST', `/${leadId}/notes`, { content: note });
  }

  // Schedule follow-up
  scheduleFollowUp(leadId, dateTime, notes) {
    return this.custom('POST', `/${leadId}/follow-up`, {
      scheduledAt: dateTime,
      notes,
    });
  }

  // Export leads
  exportLeads(filters = {}) {
    return this.api.get('', {
      params: { ...filters, export: 'csv' },
      responseType: 'blob',
    });
  }
}

export default new LeadService();
```

---

## Deal Service

Create `src/services/dealService.js`:

```javascript
import { BaseService } from './baseService';

class DealService extends BaseService {
  constructor() {
    super('deals');
  }

  // Get all deals
  getDeals(filters = {}) {
    return this.getList({
      grouped: filters.grouped || false,  // Returns deals grouped by stage
      stage: filters.stage,
      customer: filters.customer,
      owner: filters.owner,
      page: filters.page || 1,
      limit: filters.limit || 50,
      sort: filters.sort || '-createdAt',
    });
  }

  // Get single deal with activities
  getDeal(id) {
    return this.getById(id);
  }

  // Create new deal
  createDeal(dealData) {
    return this.create(dealData);
  }

  // Update deal
  updateDeal(id, dealData) {
    return this.update(id, dealData);
  }

  // Update deal stage (for Kanban)
  updateDealStage(id, stage) {
    return this.custom('PUT', `/${id}/stage`, { stage });
  }

  // Delete deal
  deleteDeal(id) {
    return this.delete(id);
  }

  // Mark deal as won
  MarkAsWon(id, actualCloseDate) {
    return this.custom('PUT', `/${id}/stage`, {
      stage: 'Won',
      actualCloseDate,
    });
  }

  // Mark deal as lost
  MarkAsLost(id, reason) {
    return this.custom('PUT', `/${id}/stage`, {
      stage: 'Lost',
      lossReason: reason,
    });
  }

  // Add deal activity (note, attachment, etc.)
  addActivity(dealId, activityData) {
    return this.custom('POST', `/${dealId}/activities`, activityData);
  }

  // Get deal forecast
  getDealForecast(filters = {}) {
    return this.custom('GET', '/forecast', undefined, { params: filters });
  }

  // Get deal analytics
  getDealAnalytics(filters = {}) {
    return this.custom('GET', '/analytics', undefined, { params: filters });
  }
}

export default new DealService();
```

---

## Customer Service

Create `src/services/customerService.js`:

```javascript
import { BaseService } from './baseService';

class CustomerService extends BaseService {
  constructor() {
    super('customers');
  }

  // Get all customers
  getCustomers(filters = {}) {
    return this.getList({
      search: filters.search,
      industry: filters.industry,
      status: filters.status,
      page: filters.page || 1,
      limit: filters.limit || 20,
      sort: filters.sort || '-createdAt',
    });
  }

  // Get single customer
  getCustomer(id) {
    return this.getById(id);
  }

  // Create customer
  createCustomer(customerData) {
    return this.create(customerData);
  }

  // Update customer
  updateCustomer(id, customerData) {
    return this.update(id, customerData);
  }

  // Delete customer
  deleteCustomer(id) {
    return this.delete(id);
  }

  // Get customer deals
  getCustomerDeals(customerId) {
    return this.custom('GET', `/${customerId}/deals`);
  }

  // Get customer communications
  getCustomerCommunications(customerId) {
    return this.custom('GET', `/${customerId}/communications`);
  }

  // Get customer contacts
  getCustomerContacts(customerId) {
    return this.custom('GET', `/${customerId}/contacts`);
  }

  // Add contact to customer
  addContact(customerId, contactData) {
    return this.custom('POST', `/${customerId}/contacts`, contactData);
  }
}

export default new CustomerService();
```

---

## Contact Service

Create `src/services/contactService.js`:

```javascript
import { BaseService } from './baseService';

class ContactService extends BaseService {
  constructor() {
    super('contacts');
  }

  // Get contacts for a customer
  getContacts(customerId, params = {}) {
    if (customerId) {
      return this.custom('GET', `?customer=${customerId}`, undefined, { params });
    }
    return this.getList(params);
  }

  // Get single contact
  getContact(id) {
    return this.getById(id);
  }

  // Create contact
  createContact(contactData) {
    return this.create(contactData);
  }

  // Update contact
  updateContact(id, contactData) {
    return this.update(id, contactData);
  }

  // Delete contact
  deleteContact(id) {
    return this.delete(id);
  }

  // Mark contact as primary
  markAsPrimary(customerId, contactId) {
    return this.custom('PUT', `/${contactId}/mark-primary`, { customerId });
  }

  // Get contact communications
  getContactCommunications(contactId) {
    return this.custom('GET', `/${contactId}/communications`);
  }
}

export default new ContactService();
```

---

## Call/Activity Service

Create `src/services/activityService.js`:

```javascript
import { BaseService } from './baseService';

class ActivityService extends BaseService {
  constructor() {
    super('activities');
  }

  // Get activities for an entity (lead, customer, deal)
  getActivities(entityType, entityId, filters = {}) {
    return this.getList({
      entityType,
      entityId,
      type: filters.type,
      page: filters.page || 1,
      limit: filters.limit || 20,
    });
  }

  // Create call
  createCall(callData) {
    return this.custom('POST', '/calls', callData);
  }

  // Update call
  updateCall(id, callData) {
    return this.custom('PUT', `/calls/${id}`, callData);
  }

  // Complete call
  completeCall(id, duration, result, notes) {
    return this.custom('PUT', `/calls/${id}/complete`, {
      duration,
      result,
      notes,
    });
  }

  // Create meeting
  createMeeting(meetingData) {
    return this.custom('POST', '/meetings', meetingData);
  }

  // Update meeting
  updateMeeting(id, meetingData) {
    return this.custom('PUT', `/meetings/${id}`, meetingData);
  }

  // Complete meeting
  completeMeeting(id, notes, attendees) {
    return this.custom('PUT', `/meetings/${id}/complete`, {
      notes,
      attendees,
    });
  }

  // Create task/todo
  createTask(taskData) {
    return this.custom('POST', '/tasks', taskData);
  }

  // Complete task
  completeTask(id) {
    return this.custom('PUT', `/tasks/${id}/complete`);
  }

  // Add note
  addNote(entityType, entityId, content) {
    return this.custom('POST', '/notes', {
      entityType,
      entityId,
      content,
    });
  }

  // Timeline (unified activity stream)
  getTimeline(entityType, entityId) {
    return this.custom('GET', `/timeline/${entityType}/${entityId}`);
  }
}

export default new ActivityService();
```

---

## Master Data Service

Create `src/services/masterDataService.js`:

```javascript
import { BaseService } from './baseService';

class MasterDataService extends BaseService {
  constructor() {
    super('master');
  }

  // Get master data by type
  getMasterData(type) {
    return this.custom('GET', `/${type}`);
  }

  // Create master data item
  createMasterItem(type, itemData) {
    return this.custom('POST', `/${type}`, itemData);
  }

  // Update master data item
  updateMasterItem(type, id, itemData) {
    return this.custom('PUT', `/${type}/${id}`, itemData);
  }

  // Delete master data item
  deleteMasterItem(type, id) {
    return this.custom('DELETE', `/${type}/${id}`);
  }

  // Get all master data (all types)
  getAllMasterData() {
    return this.custom('GET', '/all');
  }

  // Reorder master data items
  reorderItems(type, items) {
    return this.custom('PUT', `/${type}/reorder`, { items });
  }
}

export default new MasterDataService();
```

---

## User Service

Create `src/services/userService.js`:

```javascript
import { BaseService } from './baseService';

class UserService extends BaseService {
  constructor() {
    super('users');
  }

  // Get all users (company admin view)
  getUsers(filters = {}) {
    return this.getList({
      role: filters.role,
      branch: filters.branch,
      status: filters.status,
      search: filters.search,
      page: filters.page || 1,
      limit: filters.limit || 20,
    });
  }

  // Get single user
  getUser(id) {
    return this.getById(id);
  }

  // Create user
  createUser(userData) {
    return this.create(userData);
  }

  // Update user
  updateUser(id, userData) {
    return this.update(id, userData);
  }

  // Deactivate user
  deactivateUser(id) {
    return this.custom('PUT', `/${id}/deactivate`, {});
  }

  // Reactivate user
  reactivateUser(id) {
    return this.custom('PUT', `/${id}/activate`, {});
  }

  // Reset password
  resetPassword(id) {
    return this.custom('POST', `/${id}/reset-password`, {});
  }

  // Get user performance metrics
  getUserMetrics(id) {
    return this.custom('GET', `/${id}/metrics`);
  }
}

export default new UserService();
```

---

## Branch Service

Create `src/services/branchService.js`:

```javascript
import { BaseService } from './baseService';

class BranchService extends BaseService {
  constructor() {
    super('branches');
  }

  // Get all branches
  getBranches(filters = {}) {
    return this.getList({
      search: filters.search,
      status: filters.status,
      page: filters.page || 1,
      limit: filters.limit || 20,
    });
  }

  // Get single branch
  getBranch(id) {
    return this.getById(id);
  }

  // Create branch
  createBranch(branchData) {
    return this.create(branchData);
  }

  // Update branch
  updateBranch(id, branchData) {
    return this.update(id, branchData);
  }

  // Delete branch
  deleteBranch(id) {
    return this.delete(id);
  }

  // Assign branch manager
  assignManager(branchId, userId) {
    return this.custom('PUT', `/${branchId}/assign-manager`, {
      userId,
    });
  }

  // Get branch metrics
  getBranchMetrics(branchId) {
    return this.custom('GET', `/${branchId}/metrics`);
  }

  // Get branch users
  getBranchUsers(branchId) {
    return this.custom('GET', `/${branchId}/users`);
  }
}

export default new BranchService();
```

---

## Dashboard Service

Create `src/services/dashboardService.js`:

```javascript
import { BaseService } from './baseService';

class DashboardService extends BaseService {
  constructor() {
    super('dashboard');
  }

  // Get dashboard data (role-specific)
  getDashboard() {
    return this.custom('GET', '/');
  }

  // Get super admin dashboard
  getSuperAdminDashboard(filters = {}) {
    return this.custom('GET', '/super-admin', undefined, { params: filters });
  }

  // Get company admin dashboard
  getCompanyAdminDashboard(filters = {}) {
    return this.custom('GET', '/company-admin', undefined, { params: filters });
  }

  // Get branch manager dashboard
  getBranchManagerDashboard(filters = {}) {
    return this.custom('GET', '/branch-manager', undefined, { params: filters });
  }

  // Get sales user dashboard
  getSalesUserDashboard(filters = {}) {
    return this.custom('GET', '/sales-user', undefined, { params: filters });
  }

  // Get key metrics
  getMetrics(startDate, endDate) {
    return this.custom('GET', '/metrics', undefined, {
      params: { startDate, endDate },
    });
  }

  // Get activity feed
  getActivityFeed(limit = 10) {
    return this.custom('GET', '/activities', undefined, {
      params: { limit },
    });
  }
}

export default new DashboardService();
```

---

## Report Service

Create `src/services/reportService.js`:

```javascript
import { BaseService } from './baseService';

class ReportService extends BaseService {
  constructor() {
    super('reports');
  }

  // Get revenue report
  getRevenueReport(filters = {}) {
    return this.custom('GET', '/revenue', undefined, { params: filters });
  }

  // Get lead report
  getLeadReport(filters = {}) {
    return this.custom('GET', '/leads', undefined, { params: filters });
  }

  // Get performance report
  getPerformanceReport(filters = {}) {
    return this.custom('GET', '/performance', undefined, { params: filters });
  }

  // Get forecast report
  getForecastReport(filters = {}) {
    return this.custom('GET', '/forecast', undefined, { params: filters });
  }

  // Export report to CSV
  exportReportCSV(reportType, filters = {}) {
    return this.api.get(`/${reportType}`, {
      params: { ...filters, export: 'csv' },
      responseType: 'blob',
    });
  }

  // Export report to PDF
  exportReportPDF(reportType, filters = {}) {
    return this.api.get(`/${reportType}`, {
      params: { ...filters, export: 'pdf' },
      responseType: 'blob',
    });
  }
}

export default new ReportService();
```

---

## Usage Examples in Components

### Example 1: Using Lead Service in Leads Page

```javascript
import { useState, useEffect } from 'react';
import leadService from '../services/leadService';

function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    owner: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await leadService.getLeads(filters);
      setLeads(response.data.data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertLead = async (leadId) => {
    try {
      const response = await leadService.convertLead(leadId, {
        customerName: 'John Doe Enterprises',
        customerEmail: 'john@johnenterprises.com',
        contactName: 'John Doe',
        contactDesignation: 'CEO',
        dealTitle: 'Enterprise License',
        dealValue: 50000,
        dealExpectedCloseDate: '2026-04-30',
      });
      // Handle success
      alert('Lead converted to customer successfully');
      fetchLeads(); // Refresh list
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Failed to convert lead');
    }
  };

  return (
    <div>
      {/* Your UI here */}
      {loading ? <div>Loading...</div> : <div>{/* Display leads */}</div>}
    </div>
  );
}

export default LeadsPage;
```

### Example 2: Using Deal Service in Kanban Board

```javascript
import { useState, useEffect } from 'react';
import dealService from '../services/dealService';

function DealKanban() {
  const [deals, setDeals] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      // Get deals grouped by stage
      const response = await dealService.getDeals({ grouped: true });
      setDeals(response.data.data);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { draggableId, destination } = result;

    if (!destination) return;

    try {
      // Update deal stage in backend
      await dealService.updateDealStage(draggableId, destination.droppableId);
      // Refresh deals
      fetchDeals();
    } catch (error) {
      console.error('Failed to update deal stage:', error);
      alert('Failed to move deal');
    }
  };

  return (
    <div>
      {/* Kanban board rendering */}
    </div>
  );
}

export default DealKanban;
```

---

## Error Handling Pattern

```javascript
// In components
const handleAction = async () => {
  try {
    setLoading(true);
    const response = await leadService.createLead(leadData);

    // Handle success
    toast.success('Lead created successfully');
    onSuccess(response.data.data);
  } catch (error) {
    // Handle different error types
    if (error.response?.status === 400) {
      // Validation error
      const message = error.response.data.details ?
        Object.values(error.response.data.details).join(', ') :
        error.response.data.error;
      toast.error(message);
    } else if (error.response?.status === 403) {
      // Permission error
      toast.error('You do not have permission to perform this action');
    } else if (error.response?.status === 404) {
      // Not found error
      toast.error('Resource not found');
    } else {
      // Generic error
      toast.error(error.response?.data?.error || 'An error occurred');
    }
  } finally {
    setLoading(false);
  }
};
```

---

## Tips & Best Practices

1. **Always use services**: Don't make API calls directly from components
2. **Error handling**: Always wrap service calls in try-catch
3. **Loading states**: Show loading indicators while fetching data
4. **Caching**: Consider implementing Redux or React Query for caching
5. **Pagination**: Use pagination for large data sets
6. **Throttling**: Add debounce/throttle for search fields
7. **Token refresh**: Tokens are automatically refreshed by interceptor
8. **Type safety**: Add TypeScript for better type checking

---

Generated: March 4, 2026

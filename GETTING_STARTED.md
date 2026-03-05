# 🚀 Getting Started Guide - Enterprise CRM Development

## Quick Navigation

Your CRM project now has comprehensive documentation. Here's what each document covers and when to use it:

### 📚 Documentation Files

| Document | Purpose | When to Use |
|----------|---------|------------|
| **CRM_ARCHITECTURE.md** | System design, hierarchy, workflows | Understanding overall system design |
| **IMPLEMENTATION_GUIDE.md** | Step-by-step feature implementation | Building new pages/features |
| **API_REFERENCE.md** | Complete API endpoint reference | Writing backend code, testing APIs |
| **SERVICES_LAYER_GUIDE.md** | Frontend service classes | Calling APIs from React components |
| **IMPLEMENTATION_CHECKLIST.md** | Task tracking and priorities | Project planning, progress tracking |
| **This file** | How to get started | First-time setup and orientation |

---

## System Overview (30-second summary)

Your CRM has a **4-tier user hierarchy**:

```
Super Admin (SaaS Platform)
    ├─ Company Admin (Company Level)
    │   ├─ Branch Manager (Branch Level)
    │   │   ├─ Sales User (Own data)
    │   │   └─ Sales User (Own data)
    │   └─ Branch Manager (Another Branch)
    └─ Company Admin (Another Company)
```

**Core Features**:
- Lead management and conversion to customers
- Deal pipeline with 6-stage Kanban board
- Activity tracking (calls, meetings, tasks)
- Customer and contact management
- Role-based master data configuration
- Real-time activity timeline

**Tech Stack**:
- Frontend: React 19, React Router 7, Tailwind CSS, Axios
- Backend: Node.js/Express, MongoDB, JWT

---

## Week-by-Week Implementation Plan

### Week 1: Leads Management (Priority: 🔴 CRITICAL)

**Day 1-2: Setup Leads Service & Page**
1. Create `src/services/leadService.js` (template in SERVICES_LAYER_GUIDE.md)
2. Create `src/pages/Leads.jsx` with list view
3. Implement filters, search, pagination
4. Test API integration

**Day 3-4: Lead Details & Timeline**
1. Create Lead detail modal component
2. Create ActivityTimeline component (reusable for other pages)
3. Display lead info + activities
4. Test timeline population

**Day 5: Lead Conversion**
1. Add "Convert to Customer" button
2. Create conversion modal with form
3. Implement conversion flow:
   - Create Customer record
   - Create Contact (primary)
   - Create initial Deal
   - Mark Lead as converted
4. Test end-to-end conversion

**Acceptance Criteria**:
- ✅ List 100+ leads with filters/pagination in <2 seconds
- ✅ View lead details with activity timeline
- ✅ Convert lead to customer → creates customer, contact, deal
- ✅ All data changes reflected in real-time

---

### Week 2: Deal Management & Kanban Board (Priority: 🔴 CRITICAL)

**Day 1-2: Setup Kanban Board**
1. Install `react-beautiful-dnd` or `react-dnd`
2. Create Kanban components (columns, cards)
3. Fetch deals grouped by stage
4. Display 6 columns: New Lead, Qualified, Proposal, Negotiation, Won, Lost

**Day 3: Drag-Drop Functionality**
1. Implement drag-drop between columns
2. Update backend on drop: `PUT /api/deals/{id}/stage`
3. Visual feedback during drag
4. Error handling for failed updates

**Day 4: Deal Details & Actions**
1. Create deal detail modal
2. Show deal info + timeline
3. Action buttons: Mark as Won/Lost, Add note, Schedule meeting

**Day 5: Deals List View Alternative**
1. Create regular table/list view option
2. Sort, filter, search deals
3. Toggle between Kanban and List view

**Acceptance Criteria**:
- ✅ Kanban board loads instantly with visual progress
- ✅ Drag-drop updates backend & UI without page refresh
- ✅ Deal detail modal shows all information + timeline
- ✅ Won/Lost deals show in proper columns with final dates

---

### Week 3: Activities & Customer Management (Priority: 🟡 HIGH)

**Day 1-2: Create Calls/Meetings Pages**
1. Schedule call modal (date, time, duration, lead/customer)
2. Schedule meeting modal (with link/location, attendees)
3. Complete call/meeting form (result, notes, outcome)
4. List/calendar view of activities

**Day 3: Customer & Contact Pages**
1. Create `src/pages/Customers.jsx` with list
2. Create customer detail page/modal
3. Show associated deals, contacts, activities
4. Add new contact to customer

**Day 4: Tasks/Todos Page**
1. Create task management interface
2. Quick add task button
3. Mark tasks as complete
4. Filter by status/priority/assignee

**Day 5: Integration**
1. Link activities across Leads/Customers/Deals
2. Ensure timeline shows all activity types
3. Test data consistency

**Acceptance Criteria**:
- ✅ Can schedule calls/meetings from leads/deals/customers
- ✅ Customer page shows all related data (deals, contacts, activities)
- ✅ Task management works with deadline tracking
- ✅ Activity timeline unified across entities

---

### Week 4: Master Data & Configuration (Priority: 🟡 HIGH)

**Day 1-2: Master Data UI**
1. Create `src/pages/Master.jsx`
2. Build dynamic form generator for master data types
3. Implement CRUD for 8 master data types:
   - Lead Sources, Lead Statuses, Departments
   - Industries, Email Categories, Buying Roles
   - Deal Outcomes, Call Results

**Day 3: User Management (Company Admin)**
1. Create `src/pages/Users.jsx`
2. List users by role, branch, status
3. Add/edit user modals
4. Reset password functionality
5. Deactivate/activate users

**Day 4: Branch Management (Company Admin)**
1. Create `src/pages/Branches.jsx`
2. List, create, edit branches
3. Assign branch managers
4. View branch metrics

**Day 5: Dashboard Updates**
1. Create role-specific dashboard pages
2. Super Admin: Platform metrics → Company Admin should be same
3. Company Admin: Company performance + branch comparison
4. Branch Manager: Branch leads, deals, team performance
5. Sales User: My leads, my deals, activity targets

**Acceptance Criteria**:
- ✅ All master data configurable by company admin
- ✅ User creation auto-sends invite email with temp password
- ✅ Branch manager assignment updates UI in real-time
- ✅ Role-specific dashboards show relevant metrics

---

## Developer Quick Reference

### Adding a New Page

1. **Create Service** (if calling API)
   ```javascript
   // src/services/myFeatureService.js
   import { BaseService } from './baseService';
   class MyFeatureService extends BaseService {
     constructor() {
       super('my-endpoint');
     }
     // Add methods...
   }
   export default new MyFeatureService();
   ```

2. **Create Page Component**
   ```javascript
   // src/pages/MyFeature.jsx
   import { useState, useEffect } from 'react';
   import myFeatureService from '../services/myFeatureService';

   export default function MyFeaturePage() {
     const [data, setData] = useState([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       fetchData();
     }, []);

     const fetchData = async () => {
       try {
         setLoading(true);
         const response = await myFeatureService.getList();
         setData(response.data.data);
       } catch (error) {
         console.error('Error:', error);
       } finally {
         setLoading(false);
       }
     };

     return <div>{/* Your JSX */}</div>;
   }
   ```

3. **Add Route** (in `src/App.jsx`)
   ```javascript
   {
     element: <ProtectedLayout />,
     children: [
       {
         path: 'my-feature',
         element: <MyFeaturePage />,
         allowedRoles: ['company_admin', 'branch_manager'],
       },
       // ... other routes
     ],
   }
   ```

4. **Add Sidebar Menu Item** (in `src/components/Sidebar.jsx`)
   ```javascript
   // In getMenuItems() function
   if (['company_admin', 'branch_manager'].includes(role)) {
     menuItems.push({
       label: 'My Feature',
       icon: FiIcon,
       path: '/my-feature',
     });
   }
   ```

---

### Adding a New API Endpoint

1. **Create Route** (`backend/routes/myFeatureRoutes.js`)
   ```javascript
   const express = require('express');
   const router = express.Router();
   const auth = require('../middleware/authMiddleware');
   const controller = require('../controllers/myFeatureController');

   router.get('/', auth, controller.getAll);
   router.post('/', auth, controller.create);
   router.put('/:id', auth, controller.update);
   router.delete('/:id', auth, controller.delete);

   module.exports = router;
   ```

2. **Create Controller** (`backend/controllers/myFeatureController.js`)
   ```javascript
   exports.getAll = async (req, res) => {
     try {
       const { page = 1, limit = 20 } = req.query;
       const user = req.user;

       // Apply role-based filtering
       let filter = {};
       if (user.role !== 'super_admin') {
         filter.companyId = user.companyId;
       }

       const data = await MyFeature.find(filter)
         .skip((page - 1) * limit)
         .limit(limit);

       res.json({
         success: true,
         data,
         pagination: { page, limit, total: await MyFeature.countDocuments(filter) },
       });
     } catch (error) {
       res.status(500).json({ success: false, error: error.message });
     }
   };

   exports.create = async (req, res) => {
     try {
       const { body, user } = req;
       const newItem = new MyFeature({
         ...body,
         companyId: user.companyId,
         branchId: user.branchId,
         createdBy: user._id,
       });
       await newItem.save();
       res.status(201).json({ success: true, data: newItem });
     } catch (error) {
       res.status(400).json({ success: false, error: error.message });
     }
   };
   ```

3. **Mount Route** (in `backend/server.js`)
   ```javascript
   const myFeatureRoutes = require('./routes/myFeatureRoutes');
   app.use('/api/my-feature', myFeatureRoutes);
   ```

---

## Common Patterns

### Pattern 1: List with Filters & Pagination

```javascript
const [items, setItems] = useState([]);
const [filters, setFilters] = useState({
  search: '',
  status: '',
  page: 1,
  limit: 20,
});

useEffect(() => {
  fetchItems();
}, [filters]); // Re-fetch when filters change

const fetchItems = async () => {
  const response = await service.getList(filters);
  setItems(response.data.data);
};

// Component JSX:
<input
  placeholder="Search..."
  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
/>
<select onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
  <option value="">All Statuses</option>
  {/* Options */}
</select>
```

### Pattern 2: Edit Modal (Create/Update)

```javascript
const [openModal, setOpenModal] = useState(false);
const [editingId, setEditingId] = useState(null);
const [formData, setFormData] = useState({});

const handleEdit = (item) => {
  setEditingId(item._id);
  setFormData(item);
  setOpenModal(true);
};

const handleSave = async () => {
  try {
    if (editingId) {
      await service.update(editingId, formData);
    } else {
      await service.create(formData);
    }
    setOpenModal(false);
    fetchItems(); // Refresh list
  } catch (error) {
    // Handle error
  }
};
```

### Pattern 3: Delete with Confirmation

```javascript
const handleDelete = (id) => {
  if (window.confirm('Are you sure you want to delete this item?')) {
    deleteItem(id);
  }
};

const deleteItem = async (id) => {
  try {
    await service.delete(id);
    setItems(items.filter((item) => item._id !== id));
  } catch (error) {
    // Handle error
  }
};
```

### Pattern 4: Real-time Search (Debounced)

```javascript
import { useCallback } from 'react';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const handleSearch = useCallback(
  debounce((searchTerm) => {
    setFilters({ ...filters, search: searchTerm, page: 1 });
  }, 300),
  []
);
```

---

## Testing Your Implementation

### Manual Testing Checklist

- [ ] Login with different roles (super_admin, company_admin, branch_manager, sales)
- [ ] Verify sidebar shows correct menu items for each role
- [ ] Test creating, reading, updating, deleting items
- [ ] Test filters and search
- [ ] Test pagination
- [ ] Test responsive design on mobile
- [ ] Check browser console for errors
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test drag-drop on different browsers
- [ ] Test with large datasets (100+ items)

### API Testing with cURL

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' | jq -r '.token')

# List items
curl -X GET http://localhost:5000/api/items \
  -H "Authorization: Bearer $TOKEN"

# Create item
curl -X POST http://localhost:5000/api/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Item","status":"active"}'

# Update item
curl -X PUT http://localhost:5000/api/items/ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Item"}'
```

---

## Performance Optimization Tips

1. **Lazy Load Pages**
   ```javascript
   const Leads = React.lazy(() => import('./pages/Leads'));
   <Suspense fallback={<LoadingSpinner />}>
     <Routes>
       <Route path="leads" element={<Leads />} />
     </Routes>
   </Suspense>
   ```

2. **Pagination**: Always paginate lists (use limit=20)

3. **Memoization**:
   ```javascript
   const MemoizedComponent = React.memo(Component);
   const memoizedValue = useMemo(() => computeValue(a, b), [a, b]);
   ```

4. **Virtual Scrolling**: For 1000+ items, use `react-window`

5. **API Caching**: Consider implementing React Query or SWR

---

## Common Issues & Solutions

### Issue: "No token provided"
- **Solution**: Ensure token is in localStorage after login. Check AuthContext implementation.

### Issue: CORS errors
- **Solution**: Verify backend CORS config allows frontend origin. Check server.js.

### Issue: Blank page after login
- **Solution**: Check browser console for JavaScript errors. Ensure routes are correct in App.jsx.

### Issue: Data not updating after create/edit
- **Solution**: Refresh data by calling fetch function again after successful API call.

### Issue: Role-based menu not filtering correctly
- **Solution**: Verify user object is correctly stored in localStorage with role field.

---

## Support & Debugging

### Enable Debug Logging

```javascript
// In services/baseService.js
this.api.interceptors.request.use((config) => {
  console.log('API Request:', config);
  return config;
});

this.api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  },
  (error) => {
    console.log('API Error:', error);
    return Promise.reject(error);
  }
);
```

### Check Database

```bash
# Connect to MongoDB
mongosh  # or mongo

# List databases
show dbs

# Select CRM database
use crm  # or your database name

# Check collections
show collections

# Query data
db.users.find()
db.leads.find()
db.deals.find()
```

---

## Next Steps

1. ✅ **Read** CRM_ARCHITECTURE.md for system overview
2. ✅ **Read** IMPLEMENTATION_CHECKLIST.md to see all tasks
3. 🔄 **Start with Week 1**: Implement Leads management
4. 🔄 **Use** SERVICES_LAYER_GUIDE.md for API integration
5. ✅ **Reference** API_REFERENCE.md for endpoint details
6. 📋 **Track** progress in IMPLEMENTATION_CHECKLIST.md

---

## Key Success Factors

✨ Following these will ensure smooth development:

1. **Always use services layer** - don't call API directly from components
2. **Test API endpoints first** - before building UI
3. **Apply role-based filtering** - on every API call
4. **Handle errors gracefully** - show user-friendly messages
5. **Test with multiple roles** - every feature works for all users
6. **Keep components reusable** - ActivityTimeline, forms, etc.
7. **Document complex logic** - help future developers understand

---

## Team Collaboration

### For Backend Developers
- Follow patterns in IMPLEMENTATION_GUIDE.md for controller examples
- Apply role-based filtering on every query
- Use timestamps (createdAt, updatedAt) for audit trails
- Test endpoints with token authorization

### For Frontend Developers
- Use services layer for all API calls
- Follow component structure in SRC folder
- Test data flows with actual backend data
- Implement error handling on every API call

---

## Celebrating Milestones

🎉 You've completed:
- ✅ Professional CRM UI layout
- ✅ Complete system architecture
- ✅ Comprehensive API documentation
- ✅ Service layer templates
- ✅ Implementation roadmap

🚀 Ready to build:
- 🔴 Leads management (Week 1)
- 🔴 Deal Kanban board (Week 2)
- 🟡 Activities & Customer pages (Week 3)
- 🟡 Master data & Admin pages (Week 4)

---

**Happy Building! 🚀**

*Last Updated: March 4, 2026*
*For questions, refer to the appropriate documentation or trace through existing code patterns.*

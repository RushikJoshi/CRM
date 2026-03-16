const express = require("express");
const router = express.Router();
const crmController = require("../controllers/crmController");
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");

router.use(auth, checkCompanyAccess);

// All CRM routes should be restricted to own company data
// Customer Routes
router.post("/customers", crmController.createCustomer);
router.get("/customers", crmController.getCustomers);
router.put("/customers/:id", crmController.updateCustomer);
router.delete("/customers/:id", crmController.deleteCustomer);
router.get("/customers/:id/360", crmController.getCustomer360);

// Contact Routes
router.post("/contacts", crmController.createContact);
router.get("/contacts", crmController.getContacts);
router.put("/contacts/:id", crmController.updateContact);
router.delete("/contacts/:id", crmController.deleteContact);

// Call Routes
router.post("/calls", crmController.createCall);
router.get("/calls", crmController.getCalls);
router.put("/calls/:id", crmController.updateCall);
router.delete("/calls/:id", crmController.deleteCall);

// Meeting Routes
router.post("/meetings", crmController.createMeeting);
router.get("/meetings", crmController.getMeetings);
router.put("/meetings/:id", crmController.updateMeeting);
router.delete("/meetings/:id", crmController.deleteMeeting);

// Todo Routes
router.post("/todos", crmController.createTodo);
router.get("/todos", crmController.getTodos);
router.put("/todos/:id", crmController.updateTodo);
router.delete("/todos/:id", crmController.deleteTodo);

// Note Routes
router.post("/notes", crmController.createNote);
router.get("/notes", crmController.getNotes);
router.delete("/notes/:id", crmController.deleteNote);

module.exports = router;

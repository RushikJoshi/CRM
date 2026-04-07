const express = require("express");
const router = express.Router();
const emailController = require("../controllers/emailController");
const protect = require("../middleware/authMiddleware");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");

// Tracking Routes (Public) — MUST BE ACCESSIBLE WITHOUT TOKEN
router.get("/track/open/:logId", emailController.trackOpen);
router.get("/track/click/:logId", emailController.trackClick);

// Protected Routes
router.use(protect, checkCompanyAccess);

// Template Routes
router.get("/templates", emailController.getTemplates);
router.post("/templates", emailController.createTemplate);
router.patch("/templates/:id", emailController.updateTemplate);
router.delete("/templates/:id", emailController.deleteTemplate);

// Sender Profiles
router.get("/senders", emailController.getSenderProfiles);
router.post("/senders", emailController.createSenderProfile);
router.patch("/senders/:id", emailController.updateSenderProfile);
router.delete("/senders/:id", emailController.deleteSenderProfile);

// Sending Route
router.post("/send", emailController.sendEmail);

module.exports = router;

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { getAuditLogs } = require("../controllers/auditLogController");

router.get("/", auth, requireRole("super_admin", "company_admin", "branch_manager"), getAuditLogs);

module.exports = router;

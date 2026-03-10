const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const { createLead, getLeads, updateLead, deleteLead, convertLead, assignLead, bulkUpdateLeads } = require("../controllers/leadController");

router.post("/", auth, requireRole("branch_manager", "sales", "company_admin"), checkCompanyAccess, createLead);
router.get("/", auth, requireRole("branch_manager", "sales", "company_admin", "super_admin"), checkCompanyAccess, getLeads);
router.patch("/bulk", auth, requireRole("branch_manager", "company_admin"), checkCompanyAccess, bulkUpdateLeads);
router.put("/:id", auth, requireRole("branch_manager", "sales", "company_admin"), checkCompanyAccess, updateLead);
router.delete("/:id", auth, requireRole("company_admin", "super_admin"), deleteLead);
router.post("/:id/convert", auth, requireRole("branch_manager", "sales", "company_admin"), checkCompanyAccess, convertLead);
router.patch("/:id/assign", auth, requireRole("branch_manager", "company_admin"), checkCompanyAccess, assignLead);

module.exports = router;
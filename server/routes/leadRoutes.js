const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  convertLead,
  assignLead,
  bulkUpdateLeads,
  importLeads,
  getLeadsPipeline,
  updateLeadStage,
  markLeadLost,
  getLostLeads,
  logInteraction,
  createTask,
  updateFollowUp,
  updateTags,
  getLeadDuplicates,
  mergeLead
} = require("../controllers/leadController");
const upload = require("../middleware/uploadMiddleware");

router.post("/", auth, requireRole("branch_manager", "sales", "company_admin"), checkCompanyAccess, createLead);
router.get("/", auth, requireRole("branch_manager", "sales", "company_admin", "super_admin"), checkCompanyAccess, getLeads);
router.get("/pipeline", auth, requireRole("branch_manager", "sales", "company_admin", "super_admin"), checkCompanyAccess, getLeadsPipeline);
router.get("/lost", auth, requireRole("branch_manager", "sales", "company_admin", "super_admin"), checkCompanyAccess, getLostLeads);
router.get("/:id/duplicates", auth, requireRole("branch_manager", "sales", "company_admin", "super_admin"), checkCompanyAccess, getLeadDuplicates);
router.get("/:id", auth, requireRole("branch_manager", "sales", "company_admin", "super_admin"), checkCompanyAccess, getLeadById);
router.post("/import", auth, requireRole("branch_manager", "company_admin"), checkCompanyAccess, upload.single("file"), importLeads);
router.patch("/bulk", auth, requireRole("branch_manager", "company_admin"), checkCompanyAccess, bulkUpdateLeads);
router.put("/:id", auth, requireRole("branch_manager", "sales", "company_admin"), checkCompanyAccess, updateLead);
router.patch("/:id", auth, requireRole("branch_manager", "sales", "company_admin"), checkCompanyAccess, updateLead);
router.patch("/:id/stage", auth, requireRole("branch_manager", "sales", "company_admin"), checkCompanyAccess, updateLeadStage);
router.post("/:id/lost", auth, requireRole("branch_manager", "sales", "company_admin"), checkCompanyAccess, markLeadLost);
router.delete("/:id", auth, requireRole("company_admin", "super_admin"), deleteLead);
router.post("/:id/convert", auth, requireRole("branch_manager", "sales", "company_admin"), checkCompanyAccess, convertLead);
router.post("/:id/interactions", auth, requireRole("branch_manager", "sales", "company_admin"), checkCompanyAccess, logInteraction);
router.post("/:id/tasks", auth, requireRole("branch_manager", "sales", "company_admin"), checkCompanyAccess, createTask);
router.patch("/:id/follow-up", auth, requireRole("branch_manager", "sales", "company_admin"), checkCompanyAccess, updateFollowUp);
router.patch("/:id/tags", auth, requireRole("branch_manager", "sales", "company_admin"), checkCompanyAccess, updateTags);
router.patch("/:id/assign", auth, requireRole("branch_manager", "company_admin", "sales"), checkCompanyAccess, assignLead);
router.post("/:id/merge", auth, requireRole("branch_manager", "sales", "company_admin", "super_admin"), checkCompanyAccess, mergeLead);

module.exports = router;

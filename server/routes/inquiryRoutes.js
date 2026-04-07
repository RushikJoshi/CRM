const express = require("express");
const router = express.Router();
const inquiryController = require("../controllers/inquiryController");
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const requireRole = require("../middleware/requireRole");

// ✅ auth FIRST — applies to ALL routes below
router.use(auth, checkCompanyAccess);

router.post("/", requireRole("company_admin", "branch_manager", "sales", "super_admin"), inquiryController.createInquiry);
router.get("/", requireRole("company_admin", "branch_manager", "sales", "super_admin"), inquiryController.getGetInquiries || inquiryController.getInquiries); 
router.get("/:id/duplicates", requireRole("company_admin", "branch_manager", "sales", "super_admin"), inquiryController.getInquiryDuplicates);
router.get("/:id", requireRole("company_admin", "branch_manager", "sales", "super_admin"), inquiryController.getInquiryById);
router.patch("/:id", requireRole("company_admin", "branch_manager", "sales", "super_admin"), inquiryController.updateInquiry);
router.patch("/:id/assign", requireRole("company_admin", "branch_manager", "sales"), inquiryController.assignInquiry);
router.delete("/:id", requireRole("company_admin", "super_admin"), inquiryController.deleteInquiry);
router.post("/:id/merge", requireRole("company_admin", "branch_manager", "sales", "super_admin"), inquiryController.mergeInquiry);

// Convert:
router.post("/:id/convert", requireRole("company_admin", "branch_manager", "sales"), inquiryController.convertInquiryToLead);

module.exports = router;



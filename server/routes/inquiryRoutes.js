const express = require("express");
const router = express.Router();
const inquiryController = require("../controllers/inquiryController");
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");

// ✅ auth FIRST — applies to ALL routes below
router.use(auth, checkCompanyAccess);

router.post("/", inquiryController.createInquiry);
router.get("/", inquiryController.getGetInquiries || inquiryController.getInquiries); // Fallback for naming
router.get("/:id", inquiryController.getInquiryById);
router.patch("/:id", inquiryController.updateInquiry);
router.delete("/:id", inquiryController.deleteInquiry);

// Convert:
router.post("/:id/convert", inquiryController.convertInquiryToLead);

module.exports = router;


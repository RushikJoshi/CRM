const express = require("express");
const router = express.Router();
const inquiryController = require("../controllers/inquiryController");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ authMiddleware FIRST — applies to ALL routes below including POST /
router.use(authMiddleware);

router.post("/", inquiryController.createInquiry);
router.get("/", inquiryController.getInquiries);
router.post("/:id/convert", inquiryController.convertInquiryToLead);
router.put("/:id/status", inquiryController.updateInquiryStatus);
router.delete("/:id", inquiryController.deleteInquiry);

module.exports = router;

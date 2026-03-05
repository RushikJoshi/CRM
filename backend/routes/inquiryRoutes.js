const express = require("express");
const router = express.Router();
const inquiryController = require("../controllers/inquiryController");
const authMiddleware = require("../middleware/authMiddleware");

// Public route for website forms
router.post("/", inquiryController.createInquiry);

router.use(authMiddleware);

router.get("/", inquiryController.getInquiries);
router.post("/:id/convert", inquiryController.convertInquiryToLead);
router.delete("/:id", inquiryController.deleteInquiry);

module.exports = router;

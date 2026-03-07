const express = require("express");
const router = express.Router();
const cors = require("cors");
const { publicCreateInquiry } = require("../controllers/publicInquiryController");

// Allow WordPress/External sites to submit inquiries
const publicCors = cors({
    origin: "*",
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
});

router.options("/inquiry", publicCors);
router.post("/inquiry", publicCors, publicCreateInquiry);

// Alias for WordPress/External Integrations
router.options("/external/inquiries/single", publicCors);
router.post("/external/inquiries/single", publicCors, publicCreateInquiry);

module.exports = router;

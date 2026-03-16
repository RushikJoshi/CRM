const express = require("express");
const router = express.Router();
const cors = require("cors");
const { publicCreateInquiry, publicCheckApiKey } = require("../controllers/publicInquiryController");

// Allow WordPress/External sites to submit inquiries
const publicCors = cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-api-key", "X-API-KEY"]
});

// Debug: GET /api/public/check?apiKey=YOUR_COMPANY_ID — verify key and company
router.get("/check", publicCors, publicCheckApiKey);

// Health check: GET /api/public/inquiry → confirms public API is reachable (no auth)
router.get("/inquiry", publicCors, (req, res) => {
    res.json({
        success: true,
        message: "Public inquiry API is reachable. Use POST with x-api-key and body: name, email, phone.",
        method: "POST",
        bodyRequired: ["name", "email", "phone"]
    });
});

router.options("/inquiry", publicCors);
router.post("/inquiry", publicCors, publicCreateInquiry);

// Alias for WordPress/External Integrations
router.options("/external/inquiries/single", publicCors);
router.post("/external/inquiries/single", publicCors, publicCreateInquiry);

module.exports = router;

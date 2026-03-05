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

module.exports = router;

const express = require("express");
const router = express.Router();
const { trackOpen, trackClick } = require("../controllers/trackController");

// Public endpoints for tracking
router.get("/open/:emailId", trackOpen);
router.get("/click/:emailId", trackClick);

module.exports = router;

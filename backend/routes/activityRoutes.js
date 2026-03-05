const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/timeline", authMiddleware, activityController.getActivityTimeline);

module.exports = router;

const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/branchAnalyticsController");
const auth = require("../middleware/auth");

router.use(auth);

// Branch Analytics Dashboard data
router.get("/", ctrl.getBranchAnalytics);

// Team Leaderboard with Badges
router.get("/leaderboard", ctrl.getLeaderboard);

// Auto-Assignment Status
router.get("/auto-assign/status", ctrl.getAssignmentStatus);

// One-click Redistribute unassigned leads
router.post("/auto-assign/redistribute", ctrl.redistributeLeads);

module.exports = router;

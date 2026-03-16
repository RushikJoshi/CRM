const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");

// Unified Activity Logging
router.post("/", auth, checkCompanyAccess, activityController.createActivity);
router.get("/lead/:leadId", auth, checkCompanyAccess, activityController.getActivitiesByLead);
router.get("/timeline", auth, checkCompanyAccess, activityController.getActivityTimeline);

module.exports = router;

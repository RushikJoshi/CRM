const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaignController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Get Campaigns Dashboard
router.get("/", campaignController.getCampaigns);

// Audience Counting helper
router.get("/audience/count", campaignController.getAudienceCount);

// Create New Campaign
router.post("/create", campaignController.createCampaign);

// Get Single Campaign with Logs
router.get("/:id", campaignController.getCampaignById);

module.exports = router;

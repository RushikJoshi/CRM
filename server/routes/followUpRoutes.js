const express = require("express");
const router = express.Router();
const followUpController = require("../controllers/followUpController");
const auth = require("../middleware/auth");

router.use(auth);

// Lead level routes
router.post("/lead/:id/follow-up", followUpController.createFollowUp);
router.get("/lead/:id/follow-ups", followUpController.getFollowUps);

// Record level routes
router.patch("/:id/status", followUpController.updateStatus);

module.exports = router;

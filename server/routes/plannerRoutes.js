const express = require("express");
const router = express.Router();
const plannerController = require("../controllers/plannerController");
const auth = require("../middleware/auth");

router.get("/today", auth, plannerController.getDailyPlanner);
router.get("/stats", auth, plannerController.getPersonalStats);

module.exports = router;

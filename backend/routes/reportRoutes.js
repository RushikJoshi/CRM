const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/reportController");

router.get("/revenue", auth, controller.getRevenueByMonth);
router.get("/deals-by-stage", auth, controller.getDealsByStage);
router.get("/lead-conversions", auth, controller.getLeadConversions);
router.get("/user-performance", auth, controller.getUserPerformance);
router.get("/deal-forecasting", auth, controller.getDealForecasting);

module.exports = router;

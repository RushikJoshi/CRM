const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const controller = require("../controllers/reportController");

router.use(auth, checkCompanyAccess);

router.get("/revenue", requireRole("super_admin", "company_admin"), controller.getRevenueByMonth);
router.get("/deals-by-stage", requireRole("super_admin", "company_admin", "branch_manager"), controller.getDealsByStage);
router.get("/lead-conversions", requireRole("super_admin", "company_admin", "branch_manager"), controller.getLeadConversions);
router.get("/user-performance", requireRole("super_admin", "company_admin", "branch_manager"), controller.getUserPerformance);
router.get("/deal-forecasting", requireRole("super_admin", "company_admin"), controller.getDealForecasting);

module.exports = router;

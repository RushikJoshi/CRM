const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const { getDashboardStats, getLeadsStats, getDealsStats, getConversionStats } = require("../controllers/dashboardController");

router.get("/", auth, checkCompanyAccess, getDashboardStats);
router.get("/leads", auth, checkCompanyAccess, getLeadsStats);
router.get("/deals", auth, checkCompanyAccess, getDealsStats);
router.get("/conversion", auth, checkCompanyAccess, getConversionStats);

module.exports = router;
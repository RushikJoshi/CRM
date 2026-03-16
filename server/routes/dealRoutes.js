const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const {
  createDeal,
  getDeals,
  updateStage,
  updateDeal,
  deleteDeal
} = require("../controllers/dealController");

router.use(auth, checkCompanyAccess);

router.post("/", requireRole("company_admin", "branch_manager", "sales"), createDeal);
router.get("/", requireRole("company_admin", "branch_manager", "sales", "super_admin"), getDeals);
router.put("/:id", requireRole("company_admin", "branch_manager", "sales"), updateDeal);
router.delete("/:id", requireRole("company_admin", "super_admin"), deleteDeal);
router.put("/:id/stage", requireRole("company_admin", "branch_manager", "sales"), updateStage);

module.exports = router;
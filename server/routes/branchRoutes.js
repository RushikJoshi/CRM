const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const {
  createBranch,
  getBranches,
  getBranchById,
  lookupPostalCode,
  updateBranch,
  deleteBranch,
  toggleBranchStatus,
} = require("../controllers/branchController");

router.post("/", auth, requireRole("super_admin", "company_admin"), checkCompanyAccess, createBranch);
router.get("/", auth, requireRole("super_admin", "company_admin", "branch_manager", "sales", "support"), checkCompanyAccess, getBranches);
router.get("/postal-code/:postalCode", auth, requireRole("super_admin", "company_admin", "branch_manager", "sales", "support"), checkCompanyAccess, lookupPostalCode);
router.get("/:id", auth, requireRole("super_admin", "company_admin", "branch_manager", "sales", "support"), checkCompanyAccess, getBranchById);
router.put("/:id", auth, requireRole("super_admin", "company_admin"), checkCompanyAccess, updateBranch);
router.patch("/:id/toggle-status", auth, requireRole("super_admin", "company_admin"), checkCompanyAccess, toggleBranchStatus);
router.delete("/:id", auth, requireRole("super_admin", "company_admin"), checkCompanyAccess, deleteBranch);

module.exports = router;

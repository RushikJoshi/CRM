const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  toggleBranchStatus,
} = require("../controllers/branchController");

router.post("/", auth, requireRole("super_admin", "company_admin"), checkCompanyAccess, createBranch);
router.get("/", auth, requireRole("super_admin", "company_admin", "branch_manager"), checkCompanyAccess, getBranches);
router.get("/:id", auth, requireRole("super_admin", "company_admin", "branch_manager"), checkCompanyAccess, getBranchById);
router.put("/:id", auth, requireRole("super_admin", "company_admin"), checkCompanyAccess, updateBranch);
router.patch("/:id/toggle-status", auth, requireRole("super_admin", "company_admin"), checkCompanyAccess, toggleBranchStatus);
router.delete("/:id", auth, requireRole("super_admin", "company_admin"), checkCompanyAccess, deleteBranch);

module.exports = router;
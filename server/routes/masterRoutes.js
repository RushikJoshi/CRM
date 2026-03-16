const express = require("express");
const router = express.Router();
const masterController = require("../controllers/masterController");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");

router.use(auth, checkCompanyAccess);

// Master data is usually manageable by Super Admin or Company Admin
router.post("/", requireRole("super_admin", "company_admin"), masterController.createMasterData);
router.get("/", requireRole("super_admin", "company_admin", "branch_manager", "sales"), masterController.getMasterData);
router.put("/reorder", requireRole("super_admin", "company_admin"), masterController.reorderMasterData);
router.put("/:id", requireRole("super_admin", "company_admin"), masterController.updateMasterData);
router.delete("/:id", requireRole("super_admin", "company_admin"), masterController.deleteMasterData);

module.exports = router;

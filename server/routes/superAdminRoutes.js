const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/superAdminController");

// All routes in this file require super_admin role
router.use(auth, requireRole("super_admin"));

router.get("/companies", controller.getAllCompanies);
router.post("/companies", controller.createCompany);
router.put("/companies/:id", controller.updateCompany);
router.delete("/companies/:id", controller.deleteCompany);

router.get("/branches", controller.getAllBranches);
router.get("/branches/:id", controller.getBranchById);
router.post("/branches", controller.createBranch);
router.put("/branches/:id", controller.updateBranch);
router.delete("/branches/:id", controller.deleteBranch);

router.get("/users", controller.getAllUsers);
router.get("/users/:id", controller.getUserById);
router.post("/users", controller.createUser);
router.put("/users/:id", controller.updateUser);
router.delete("/users/:id", controller.deleteUser);

router.get("/leads", controller.getAllLeads);
router.delete("/leads/:id", controller.deleteLead);

router.get("/deals", controller.getAllDeals);
router.put("/deals/:id", controller.updateDeal);
router.delete("/deals/:id", controller.deleteDeal);

router.get("/stats", controller.getStats);
router.get("/platform-stats", controller.getPlatformStats);

module.exports = router;
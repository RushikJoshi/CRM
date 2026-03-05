const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const superAdmin = require("../middleware/superAdmin");
const controller = require("../controllers/superAdminController");

router.get("/companies", auth, superAdmin, controller.getAllCompanies);
router.post("/companies", auth, superAdmin, controller.createCompany);
router.put("/companies/:id", auth, superAdmin, controller.updateCompany);
router.delete("/companies/:id", auth, superAdmin, controller.deleteCompany);

router.get("/branches", auth, superAdmin, controller.getAllBranches);
router.post("/branches", auth, superAdmin, controller.createBranch);
router.put("/branches/:id", auth, superAdmin, controller.updateBranch);
router.delete("/branches/:id", auth, superAdmin, controller.deleteBranch);

router.get("/users", auth, superAdmin, controller.getAllUsers);
router.post("/users", auth, superAdmin, controller.createUser);
router.put("/users/:id", auth, superAdmin, controller.updateUser);
router.delete("/users/:id", auth, superAdmin, controller.deleteUser);

router.get("/leads", auth, superAdmin, controller.getAllLeads);
router.delete("/leads/:id", auth, superAdmin, controller.deleteLead);

router.get("/deals", auth, superAdmin, controller.getAllDeals);
router.put("/deals/:id", auth, superAdmin, controller.updateDeal);
router.delete("/deals/:id", auth, superAdmin, controller.deleteDeal);

router.get("/stats", auth, superAdmin, controller.getStats);

module.exports = router;
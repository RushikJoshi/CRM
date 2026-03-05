const express = require("express");
const router = express.Router();
const masterController = require("../controllers/masterController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// Apply auth to all Master routes
router.post("/", masterController.createMasterData);
router.get("/", masterController.getMasterData);
router.put("/reorder", masterController.reorderMasterData);
router.put("/:id", masterController.updateMasterData);
router.delete("/:id", masterController.deleteMasterData);

module.exports = router;

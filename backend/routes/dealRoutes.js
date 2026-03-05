const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createDeal,
  getDeals,
  updateStage,
  updateDeal,
  deleteDeal
} = require("../controllers/dealController");

router.post("/", authMiddleware, createDeal);
router.get("/", authMiddleware, getDeals);
router.put("/:id", authMiddleware, updateDeal);
router.delete("/:id", authMiddleware, deleteDeal);
router.put("/:id/stage", authMiddleware, updateStage);

module.exports = router;
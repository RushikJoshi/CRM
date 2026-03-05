const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { createLead, getLeads, updateLead, deleteLead } = require("../controllers/leadController");
const { convertLead } = require("../controllers/leadController");

router.post("/", authMiddleware, createLead);
router.get("/", authMiddleware, getLeads);
router.put("/:id", authMiddleware, updateLead);
router.delete("/:id", authMiddleware, deleteLead);
router.post("/:id/convert", authMiddleware, convertLead);

module.exports = router;
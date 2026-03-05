const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { createBranch, getBranches } = require("../controllers/branchController");

router.post("/", authMiddleware, createBranch);
router.get("/", authMiddleware, getBranches);

module.exports = router;
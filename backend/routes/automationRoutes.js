const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { createRule, getRules, updateRule, deleteRule } = require("../controllers/automationController");

router.use(auth);

router.get("/", getRules);
router.post("/", createRule);
router.put("/:id", updateRule);
router.delete("/:id", deleteRule);

module.exports = router;

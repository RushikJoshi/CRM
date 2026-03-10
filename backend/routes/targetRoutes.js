const express = require("express");
const router = express.Router();
const tc = require("../controllers/targetController");
const auth = require("../middleware/auth");

router.use(auth);

// Team member listing (for the set-target dropdown)
router.get("/team", tc.getTeamMembers);

// My own target (for Sales Rep)
router.get("/my", tc.getMyTarget);

// List all branch targets (for Branch Manager)
router.get("/", tc.getTargets);

// Set or update a target (upsert)
router.post("/", tc.setTarget);

// Delete
router.delete("/:id", tc.deleteTarget);

module.exports = router;

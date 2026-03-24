const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const { getPipeline } = require("../controllers/pipelineController");

// ONE PIPELINE PER COMPANY — no query params needed
// Company Admin / Branch Manager / Sales all use this single endpoint
router.get("/", auth, checkCompanyAccess, getPipeline);

module.exports = router;

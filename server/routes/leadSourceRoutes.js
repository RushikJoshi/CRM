const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const { getLeadSources, createLeadSource } = require("../controllers/leadSourceController");

router.get("/", auth, checkCompanyAccess, getLeadSources);
router.post("/", auth, checkCompanyAccess, createLeadSource);

module.exports = router;

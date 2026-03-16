const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");

router.get("/", auth, checkCompanyAccess, searchController.globalSearch);

module.exports = router;

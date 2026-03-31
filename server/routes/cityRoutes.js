const express = require("express");
const router = express.Router();
const cityController = require("../controllers/cityController");
const auth = require("../middleware/auth");

router.get("/", auth, cityController.getCities);

module.exports = router;

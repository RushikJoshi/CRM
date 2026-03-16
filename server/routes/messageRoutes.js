const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");

router.use(auth, checkCompanyAccess);

router.post("/", messageController.sendMessage);
router.get("/", messageController.getMessages);

module.exports = router;

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const { getNotifications, markRead, markAllRead, getUnread } = require("../controllers/notificationController");

router.use(auth, checkCompanyAccess);

router.get("/", getNotifications);
router.get("/unread", getUnread);
router.put("/all-read", markAllRead);
router.put("/:id/read", markRead);

module.exports = router;

const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getNotifications, markRead, markAllRead, getUnread } = require("../controllers/notificationController");

router.get("/", auth, getNotifications);
router.get("/unread", auth, getUnread);
router.put("/all-read", auth, markAllRead);
router.put("/:id/read", auth, markRead);

module.exports = router;

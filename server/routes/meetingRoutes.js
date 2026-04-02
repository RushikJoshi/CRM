const express = require("express");
const router = express.Router();
const meetingController = require("../controllers/meetingController");
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");

router.use(auth, checkCompanyAccess);

router.post("/", meetingController.createMeeting);
router.get("/", meetingController.getMeetings);
router.get("/:id", meetingController.getMeetingById);
router.put("/:id", meetingController.updateMeeting);
router.delete("/:id", meetingController.deleteMeeting);

module.exports = router;

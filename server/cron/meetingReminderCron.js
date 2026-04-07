const cron = require("node-cron");
const { processDueMeetingReminders } = require("../controllers/meetingController");

const initMeetingReminderCron = () => {
  cron.schedule("* * * * *", async () => {
    try {
      await processDueMeetingReminders();
    } catch (error) {
      console.error("[MEETING CRON ERROR]", error.message);
    }
  });

  console.log("Meeting reminder scheduler initialized (1min checks)");
};

module.exports = { initMeetingReminderCron };

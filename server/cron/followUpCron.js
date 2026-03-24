const cron = require("node-cron");
const FollowUp = require("../models/FollowUp");

const initFollowUpCron = (io) => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const tenMinutesFromNow = new Date(now.getTime() + 10 * 60000);

      const pending = await FollowUp.find({
        status: "pending",
        reminded: false,
        scheduledAt: { $lte: tenMinutesFromNow }
      }).populate("leadId", "name");

      for (const f of pending) {
        // Broadcast to specific company room
        const room = `company:${f.companyId}`;
        
        io.to(room).emit("FOLLOW_UP_REMINDER", {
           id: f._id,
           leadId: f.leadId?._id,
           leadName: f.leadId?.name || "Unknown Lead",
           type: f.type,
           scheduledAt: f.scheduledAt,
           note: f.note
        });

        f.reminded = true;
        await f.save();
        console.log(`[CRON] Reminder sent for Follow-up: ${f._id} to ${room}`);
      }
    } catch (err) {
      console.error("[CRON] Follow-up Error:", err.message);
    }
  });
};

module.exports = { initFollowUpCron };

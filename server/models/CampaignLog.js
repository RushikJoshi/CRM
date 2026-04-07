const mongoose = require("mongoose");

const campaignLogSchema = new mongoose.Schema({
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, refPath: "audienceType" }, // Can be Lead or Inquiry object id
    audienceType: { type: String, enum: ["LEADS", "INQUIRIES"], required: true },
    recipientName: { type: String, default: "" },
    recipient: { type: String, required: true }, // phone or email
    status: { type: String, enum: ["SENT", "FAILED", "PENDING", "OPENED", "CLICKED"], default: "PENDING" },
    emailLogId: { type: mongoose.Schema.Types.ObjectId, ref: "EmailLog", default: null },
    sentAt: { type: Date },
    openedAt: { type: Date, default: null },
    clickedAt: { type: Date, default: null },
    openedCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
    error: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Optimized indexes
campaignLogSchema.index({ campaignId: 1, status: 1 });
campaignLogSchema.index({ leadId: 1 });

const CampaignLog = mongoose.model("CampaignLog", campaignLogSchema);
module.exports = CampaignLog;

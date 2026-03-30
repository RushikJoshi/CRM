const mongoose = require("mongoose");

const campaignLogSchema = new mongoose.Schema({
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, refPath: "audienceType" }, // Can be Lead or Inquiry object id
    audienceType: { type: String, enum: ["LEADS", "INQUIRIES"], required: true },
    recipient: { type: String, required: true }, // phone or email
    status: { type: String, enum: ["SENT", "FAILED", "PENDING"], default: "PENDING" },
    sentAt: { type: Date },
    error: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Optimized indexes
campaignLogSchema.index({ campaignId: 1, status: 1 });
campaignLogSchema.index({ leadId: 1 });

const CampaignLog = mongoose.model("CampaignLog", campaignLogSchema);
module.exports = CampaignLog;

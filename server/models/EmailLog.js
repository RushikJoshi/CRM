const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailTemplate",
      default: null,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
    },
    campaignLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CampaignLog",
      default: null,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    isOpened: {
      type: Boolean,
      default: false,
    },
    openedAt: {
      type: Date,
      default: null,
    },
    isClicked: {
      type: Boolean,
      default: false,
    },
    clickedAt: {
      type: Date,
      default: null,
    },
    openedCount: {
      type: Number,
      default: 0,
    },
    clickedCount: {
      type: Number,
      default: 0,
    },
    toAddress: {
      type: String,
      required: true,
    },
    fromAddress: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["sent", "failed", "opened", "clicked"],
      default: "sent",
    },
  },
  { timestamps: true }
);

emailLogSchema.index({ leadId: 1, createdAt: -1 });
emailLogSchema.index({ companyId: 1 });

module.exports = mongoose.model("EmailLog", emailLogSchema);

const mongoose = require("mongoose");

const emailSenderProfileSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    fromName: { type: String, required: true },
    fromEmail: { type: String, required: true },
    replyTo: { type: String, default: "" },
    smtpHost: { type: String, default: "" },
    smtpPort: { type: Number, default: 587 },
    smtpSecure: { type: Boolean, default: false },
    smtpUser: { type: String, default: "" },
    smtpPass: { type: String, default: "" },
    provider: { type: String, default: "SMTP" },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

emailSenderProfileSchema.index({ companyId: 1, isDeleted: 1 });

module.exports = mongoose.model("EmailSenderProfile", emailSenderProfileSchema);

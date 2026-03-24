const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
    type: { type: String, enum: ["call", "whatsapp", "email"], default: "call" },
    scheduledAt: { type: Date, required: true },
    note: { type: String },
    status: { type: String, enum: ["pending", "completed", "missed"], default: "pending" },
    reminded: { type: Boolean, default: false },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

followUpSchema.index({ leadId: 1, scheduledAt: 1 });
followUpSchema.index({ status: 1, reminded: 1, scheduledAt: 1 });

module.exports = mongoose.model("FollowUp", followUpSchema);

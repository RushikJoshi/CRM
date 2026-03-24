const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  website: { type: String, default: "" },
  industry: { type: String, default: "" },
  address: { type: String, default: "" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  // Subscription related fields
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", default: null },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  subscriptionStatus: { type: String, enum: ["active", "expired"], default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("Company", companySchema);
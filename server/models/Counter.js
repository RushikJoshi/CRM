const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  module: { type: String, required: true }, // "lead", "company", "deal"
  year: { type: Number, required: true },
  seq: { type: Number, default: 0 }
});

counterSchema.index({ companyId: 1, module: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Counter", counterSchema);

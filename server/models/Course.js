const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    duration: { type: Number, default: 25 },
    showResult: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

courseSchema.index({ companyId: 1 });
module.exports = mongoose.model("Course", courseSchema);

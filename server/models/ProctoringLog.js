const mongoose = require("mongoose");

const proctoringLogSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true }, // Links to TestSession/Submission
    violations: {
      noFace: { type: Number, default: 0 },
      multipleFaces: { type: Number, default: 0 },
      tabSwitch: { type: Number, default: 0 },
      noise: { type: Number, default: 0 },
      fullscreenExit: { type: Number, default: 0 }
    },
    score: { type: Number, default: 100 },
    status: { type: String, enum: ["active", "completed"], default: "active" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProctoringLog", proctoringLogSchema);

const mongoose = require("mongoose");

const testSessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    questions: { type: Array, required: true }, // frontend safe
    _internal_questions: { type: Array, required: true }, // with answers
    expiresAt: { type: Date, required: true },
    isSubmitted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

testSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
module.exports = mongoose.model("TestSession", testSessionSchema);

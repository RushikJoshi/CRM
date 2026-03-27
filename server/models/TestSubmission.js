const mongoose = require("mongoose");

const testSubmissionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    questions: { type: Array, required: true }, // full snapshot
    answers: { type: Array, required: true }, // detailed comparisons
    score: { type: Number, required: true },
    totalMarks: { type: Number, default: 10 }
  },
  { timestamps: true }
);

testSubmissionSchema.index({ email: 1, courseId: 1 });

module.exports = mongoose.model("TestSubmission", testSubmissionSchema);

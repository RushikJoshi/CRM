const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String
    },

    phone: {
      type: String
    },

    companyName: {
      type: String
    },

    industry: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      default: "New"
    },
    stage: {
      type: String,
      enum: ["new_lead", "attempted_contact", "contacted", "qualified", "prospect", "won", "lost"],
      default: "new_lead"
    },
    stageUpdatedAt: {
      type: Date,
      default: null
    },

    source: { // Legacy Support
      type: String,
      default: "Website"
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeadSource"
    },

    value: {
      type: Number,
      default: 0
    },

    score: {
      type: Number,
      default: 0
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    notes: {
      type: String
    },
    city: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    course: {
      type: String,
      default: ""
    },
    location: {
      type: String,
      default: ""
    },
    inquiryStatus: {
      type: String,
      default: ""
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    isConverted: {
      type: Boolean,
      default: false
    },

    convertedAt: {
      type: Date
    },

  },
  { timestamps: true }
);

leadSchema.index({ companyId: 1 });
leadSchema.index({ companyId: 1, updatedAt: -1 });
leadSchema.index({ companyId: 1, status: 1 });
leadSchema.index({ companyId: 1, stage: 1 });
leadSchema.index({ email: 1, companyId: 1 });
leadSchema.index({ phone: 1, companyId: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ branchId: 1 });
leadSchema.index({ isDeleted: 1, companyId: 1 });

module.exports = mongoose.model("Lead", leadSchema);
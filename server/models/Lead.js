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
      default: "New"
    },

    stageUpdatedAt: {
      type: Date,
      default: null
    },
    stageHistory: {
      type: [
        {
          stage: { type: String, required: true },
          enteredAt: { type: Date, required: true },
          exitedAt: { type: Date, default: null },
        },
      ],
      default: [],
    },

    source: { // Legacy Support
      type: String,
      default: "Website"
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeadSource"
    },

    // Legacy field used across UI as expected revenue
    value: { type: Number, default: 0 },
    // Odoo-style expected revenue
    expectedRevenue: { type: Number, default: 0 },
    // Editable probability percent (0-100)
    probability: { type: Number, default: 10 },
    // Odoo-style priority stars (0-3)
    priorityStars: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 },
    rating: { type: Number, default: 1 },
    // Won/Lost metadata
    wonAt: { type: Date, default: null },
    lostAt: { type: Date, default: null },
    lostReason: { type: String, default: "" },
    lostNotes: { type: String, default: "" },
    isLost: { type: Boolean, default: false },

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
    courseSelected: {
      type: String,
      default: ""
    },
    testScore: {
      type: Number,
      default: 0
    },
    proctoringScore: {
      type: Number,
      default: 100
    },
    proctoringRisk: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low"
    },
    website: {
      type: String,
      default: ""
    },
    companySize: {
      type: String,
      default: ""
    },
    campaign: {
      type: String,
      default: ""
    },
    medium: {
      type: String,
      default: ""
    },
    location: {
      type: String,
      default: ""
    },
    inquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inquiry",
      default: null
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

    testToken: { type: String, default: null },
    proctoringStatus: { type: String, enum: ["active", "denied", "not_supported", "unknown"], default: "unknown" },
    customId: { type: String, unique: true },
  },
  { timestamps: true }
);


leadSchema.index({ companyId: 1 });
leadSchema.index({ companyId: 1, updatedAt: -1 });
leadSchema.index({ companyId: 1, status: 1 });
leadSchema.index({ companyId: 1, stage: 1 });
leadSchema.index({ companyId: 1, isLost: 1 });
leadSchema.index({ companyId: 1, wonAt: -1 });
leadSchema.index({ companyId: 1, lostAt: -1 });
leadSchema.index({ email: 1, companyId: 1 });
leadSchema.index({ phone: 1, companyId: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ branchId: 1 });
leadSchema.index({ isDeleted: 1, companyId: 1 });

module.exports = mongoose.model("Lead", leadSchema);
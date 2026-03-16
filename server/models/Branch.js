const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    // ── Basic Information ─────────────────────────────────────────────────
    name: { type: String, required: true, trim: true },
    branchCode: { type: String, trim: true, uppercase: true },
    branchType: {
      type: String,
      enum: ["head_office", "regional_office", "sales_branch", "support_center", "warehouse"],
      default: "sales_branch"
    },
    status: {
      type: String,
      enum: ["active", "inactive", "closed"],
      default: "active"
    },

    // ── Company & ownership ────────────────────────────────────────────────
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    // ── Contact Information ────────────────────────────────────────────────
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    alternatePhone: { type: String, trim: true },
    website: { type: String, trim: true },

    // ── Address Details ────────────────────────────────────────────────────
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },

    // ── Branch Management ──────────────────────────────────────────────────
    branchManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    managerEmail: { type: String, trim: true, lowercase: true },
    managerPhone: { type: String, trim: true },
    assignedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ── Operational Details ─────────────────────────────────────────────────
    openingDate: { type: Date },
    workingHours: { type: String, trim: true },
    timezone: { type: String, trim: true, default: "Asia/Kolkata" },
    branchCapacity: { type: Number, min: 0 },

    // ── Additional Information ─────────────────────────────────────────────
    logoUrl: { type: String, trim: true },
    description: { type: String, trim: true },
    documentUrls: [{ type: String, trim: true }],

    // ── Legacy / compatibility ────────────────────────────────────────────
    address: { type: String, trim: true },

    // ── Soft delete & audit ────────────────────────────────────────────────
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

// Unique branch code per company (only when branchCode is present)
branchSchema.index({ companyId: 1, branchCode: 1 }, { unique: true, sparse: true });
branchSchema.index({ companyId: 1 });
branchSchema.index({ isDeleted: 1 });
branchSchema.index({ status: 1 });

module.exports = mongoose.model("Branch", branchSchema);

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ── Core / legacy (required for auth) ─────────────────────────────────────
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "company_admin", "branch_manager", "sales", "support", "marketing"],
      default: "sales"
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "pending", "draft"],
      default: "active"
    },

    // ── 1. Personal Information ─────────────────────────────────────────────
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    displayName: { type: String, trim: true },
    profilePhotoUrl: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    dateOfBirth: { type: Date },

    // ── 2. Contact Information ─────────────────────────────────────────────
    workEmail: { type: String, trim: true, lowercase: true },
    personalEmail: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    alternatePhone: { type: String, trim: true },
    whatsappNumber: { type: String, trim: true },
    address: { type: String, trim: true },

    // ── 3. Login Information ────────────────────────────────────────────────
    username: { type: String, trim: true },
    twoFactorEnabled: { type: Boolean, default: false },

    // ── 4. Role & Permissions ───────────────────────────────────────────────
    department: { type: String, trim: true },
    reportingManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    permissionLevel: { type: String, trim: true },

    // ── 5. Branch Assignment ─────────────────────────────────────────────────
    primaryBranchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
    additionalBranchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
    team: { type: String, trim: true },
    territory: { type: String, trim: true },

    // ── 6. Work Information ─────────────────────────────────────────────────
    employeeId: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    joiningDate: { type: Date },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", ""],
      default: ""
    },

    // ── 7. CRM Sales Settings ───────────────────────────────────────────────
    salesTarget: { type: Number },
    commissionPercentage: { type: Number },
    leadAssignmentRule: { type: String, trim: true },
    defaultPipelineId: { type: mongoose.Schema.Types.ObjectId, ref: "Pipeline", default: null },

    // ── 8. Account Settings ─────────────────────────────────────────────────
    language: { type: String, trim: true, default: "en" },
    timezone: { type: String, trim: true, default: "Asia/Kolkata" },
    notificationPreferences: { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── Audit & soft delete ─────────────────────────────────────────────────
    lastLoginAt: { type: Date },
    lastAssignedAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

userSchema.index({ companyId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ branchId: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);

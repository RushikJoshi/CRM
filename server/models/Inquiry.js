const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
    {
        // ── CORE FIELDS ────────────────────────────────────────────────────────
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, trim: true },
        companyName: { type: String, trim: true },
        
        // ── RBAC & OWNERSHIP ───────────────────────────────────────────────────
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
        branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        cityId: { type: mongoose.Schema.Types.ObjectId, ref: "City", default: null },
        assignedBranchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
        assignedManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        assignedSalesIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

        // ── UNIFIED STATE ──────────────────────────────────────────────────────
        type: { 
            type: String, 
            enum: ["INQUIRY", "LEAD"], 
            default: "INQUIRY",
            required: true 
        },
        status: { type: String, default: "new" }, // inquiry status (new, contacted, etc.)
        
        // ── LEAD SPECIFIC (PIPELINE) ───────────────────────────────────────────
        stage: { type: String, default: "New" },
        stageUpdatedAt: { type: Date, default: null },
        stageHistory: {
            type: [{
                stage: { type: String },
                enteredAt: { type: Date },
                exitedAt: { type: Date, default: null }
            }],
            default: []
        },

        // ── SOURCE & CAPTURE ───────────────────────────────────────────────────
        source: { type: String, default: "manual" },
        sourceId: { type: mongoose.Schema.Types.ObjectId, ref: "LeadSource" },
        message: { type: String, trim: true },
        courseSelected: { type: String, trim: true },
        location: { type: String, trim: true },

        // ── SALES METRICS ──────────────────────────────────────────────────────
        value: { type: Number, default: 0 },
        expectedRevenue: { type: Number, default: 0 },
        probability: { type: Number, default: 10 },
        priorityStars: { type: Number, default: 0 },
        engagementScore: { type: Number, default: 0 },
        rating: { type: Number, default: 1 },

        // ── LOSS/WON METADATA ──────────────────────────────────────────────────
        isLost: { type: Boolean, default: false },
        lostAt: { type: Date, default: null },
        lostReason: { type: String, default: "" },
        lostNotes: { type: String, default: "" },
        wonAt: { type: Date, default: null },

        // ── ACADEMIC / TEST FIELDS ─────────────────────────────────────────────
        testScore: { type: Number, default: 0 },
        proctoringScore: { type: Number, default: 100 },
        proctoringRisk: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
        testToken: { type: String, default: null },
        proctoringStatus: { type: String, enum: ["active", "denied", "not_supported", "unknown"], default: "unknown" },

        // ── FOLLOW-UP & INTERACTION ──────────────────────────────────────────
        nextFollowUpDate: { type: Date, default: null },
        lastContacted: { type: Date, default: null },
        followUpStatus: { 
            type: String, 
            enum: ["PENDING", "COMPLETED", "OVERDUE"], 
            default: "PENDING" 
        },
        tags: { type: [String], default: [] },

        // ── EXTRA INFO (Extended Data) ────────────────────────────────────────
        address: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        extraInfo: {
            type: mongoose.Schema.Types.Map,
            of: mongoose.Schema.Types.Mixed,
            default: {}
        },

        // ── SYSTEM ─────────────────────────────────────────────────────────────
        customId: { type: String },
        isDeleted: { type: Boolean, default: false },
        
        // Legacy Link (for backward compatibility during migration)
        leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null } 
    },
    { timestamps: true }
);

inquirySchema.index({ companyId: 1 });
inquirySchema.index({ type: 1 });
inquirySchema.index({ email: 1 });
inquirySchema.index({ phone: 1 });
inquirySchema.index({ status: 1 });
inquirySchema.index({ stage: 1 });
inquirySchema.index({ assignedTo: 1 });
inquirySchema.index({ cityId: 1 });
inquirySchema.index({ assignedBranchId: 1 });
inquirySchema.index({ assignedManagerId: 1 });
inquirySchema.index({ assignedSalesIds: 1 });
inquirySchema.index({ companyId: 1, assignedManagerId: 1 });
inquirySchema.index({ companyId: 1, assignedSalesIds: 1 });

module.exports = mongoose.model("Inquiry", inquirySchema);


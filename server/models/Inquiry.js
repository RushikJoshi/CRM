const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            trim: true
        },
        source: {
            type: String,
            default: "manual"
        },
        message: {
            type: String,
            trim: true
        },
        location: {
            type: String,
            trim: true
        },
        courseSelected: {
            type: String,
            trim: true
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
        status: {
            type: String,
            enum: ["new", "contacted", "qualified", "converted", "rejected"],
            default: "new"
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        },
        branchId: { // Keeping for CRM consistency
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            default: null
        },
        testToken: {
            type: String,
            default: null
        },
        proctoringStatus: {
            type: String,
            enum: ["active", "denied", "not_supported", "unknown"],
            default: "unknown"
        },
        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lead",
            default: null
        }
    },
    { timestamps: true }
);

inquirySchema.index({ companyId: 1 });
inquirySchema.index({ email: 1 });
inquirySchema.index({ phone: 1 });
inquirySchema.index({ status: 1 });

module.exports = mongoose.model("Inquiry", inquirySchema);


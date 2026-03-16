const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String
        },
        companyName: {
            type: String
        },
        message: {
            type: String
        },
        value: {
            type: Number,
            default: 0
        },
        source: { // Legacy Support
            type: String,
            default: "Other"
        },
        sourceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LeadSource"
        },
        website: {
            type: String,
            default: ""
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
            default: "Fresh"
        },
        status: {
            type: String,
            enum: ["Open", "Converted", "Ignored"],
            default: "Open"
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company"
        },
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch"
        },
        isExternal: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

inquirySchema.index({ companyId: 1 });
inquirySchema.index({ email: 1 });
inquirySchema.index({ phone: 1 });

module.exports = mongoose.model("Inquiry", inquirySchema);

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
        source: {
            type: String,
            default: "Other"
        },
        website: {
            type: String,
            default: ""
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
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Inquiry", inquirySchema);

const mongoose = require("mongoose");

const leadSourceSchema = new mongoose.Schema(
    {
        name: {
            type: String, // Example: "Organic Search", "Google Ads"
            required: true
        },
        type: {
            type: String, // Example: "Inbound", "Outbound", "Referral"
            default: "Inbound"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

leadSourceSchema.index({ companyId: 1 });

module.exports = mongoose.model("LeadSource", leadSourceSchema);

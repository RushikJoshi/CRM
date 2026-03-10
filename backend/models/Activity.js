const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
    {
        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lead",
            default: null
        },
        dealId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Deal",
            default: null
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            default: null
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            enum: ["call", "email", "meeting", "note", "system", "lead", "deal", "customer", "task", "message"],
            required: true
        },
        note: {
            type: String,
            required: true
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        }
    },
    { timestamps: true }
);

activitySchema.index({ leadId: 1 });
activitySchema.index({ dealId: 1 });
activitySchema.index({ customerId: 1 });
activitySchema.index({ companyId: 1 });

module.exports = mongoose.model("Activity", activitySchema);

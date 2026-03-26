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
        inquiryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inquiry",
            default: null
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            default: null
        },
        contactId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contact",
            default: null
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        mentionedUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        title: {
            type: String,
            default: null
        },
        type: {
            type: String,
            enum: [
                "call",
                "email",
                "meeting",
                "note",
                "system",
                "lead",
                "lead_assigned",
                "lead_qualified",
                "status_change",
                "lead_stage_changed",
                "lead_lost",
                "deal",
                "deal_stage_changed",
                "customer",
                "contact",
                "task",
                "message",
                "follow_up",
                "engagement",
                "inquiry"
            ],
            required: true
        },
        note: {
            type: String,
            required: true
        },
        // Optional rich context for stage change activities
        previousStage: {
            type: String,
            default: null
        },
        newStage: {
            type: String,
            default: null
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        },
        attachments: [
            {
                name: { type: String, required: true },
                url: { type: String, required: true }
            }
        ]
    },
    { timestamps: true }
);

activitySchema.index({ leadId: 1, createdAt: -1 });
activitySchema.index({ dealId: 1, createdAt: -1 });
activitySchema.index({ customerId: 1, createdAt: -1 });
activitySchema.index({ contactId: 1, createdAt: -1 });
activitySchema.index({ inquiryId: 1, createdAt: -1 });
activitySchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);

const mongoose = require("mongoose");

const messageTrackingSchema = new mongoose.Schema(
    {
        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lead",
            required: true
        },
        type: {
            type: String,
            enum: ["whatsapp", "email"],
            required: true
        },
        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            default: "sent"
        },
        messageId: {
            type: String,
            required: true,
            unique: true
        },
        openedAt: {
            type: Date
        }
    },
    { timestamps: true }
);

messageTrackingSchema.index({ leadId: 1 });

module.exports = mongoose.model("MessageTracking", messageTrackingSchema);

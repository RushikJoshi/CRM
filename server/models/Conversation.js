const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        },
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true
        },
        lastMessage: {
            text: String,
            senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            createdAt: { type: Date, default: Date.now }
        },
        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inquiry",
            default: null
        }
    },
    { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ companyId: 1 });
conversationSchema.index({ leadId: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);

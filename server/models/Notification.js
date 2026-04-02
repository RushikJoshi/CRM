const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        },
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            default: null
        },
        type: {
            type: String,
            enum: ["info", "success", "warning", "error", "reminder", "chat"],
            default: "info"
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        metadata: {
            type: Object, // Link to entity: { leadId: '...', dealId: '...' }
            default: {}
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);

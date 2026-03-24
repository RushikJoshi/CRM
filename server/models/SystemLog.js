const mongoose = require("mongoose");

const systemLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            default: null
        },
        action: {
            type: String,
            required: true,
            default: "login"
        },
        ipAddress: {
            type: String,
            default: "unknown"
        },
        userAgent: {
            type: String,
            default: ""
        },
        location: {
            type: String,
            default: "Pending detection"
        },
        status: {
            type: String,
            enum: ["success", "failed"],
            default: "success"
        }
    },
    { timestamps: true }
);

systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model("SystemLog", systemLogSchema);

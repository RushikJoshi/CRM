const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema(
    {
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
        leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Inquiry", required: true },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        to: { type: String, required: true },
        subject: { type: String, required: true },
        body: { type: String },
        status: { 
            type: String, 
            enum: ["SENT", "OPENED", "CLICKED", "FAILED"], 
            default: "SENT" 
        },
        openedAt: { type: Date, default: null },
        clickedAt: { type: Date, default: null },
        metadata: {
            type: Map,
            of: String,
            default: {}
        }
    },
    { timestamps: true }
);

emailSchema.index({ leadId: 1, createdAt: -1 });
emailSchema.index({ companyId: 1, status: 1 });

module.exports = mongoose.model("Email", emailSchema);

const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
    name: { type: String, required: true },
    message: { type: String, required: true },
    channel: { type: String, enum: ["WHATSAPP", "EMAIL"], required: true },
    audienceType: { type: String, enum: ["LEADS", "INQUIRIES"], required: true },
    recipients: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        refPath: 'audienceType' 
    }],
    scheduledAt: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ["DRAFT", "SCHEDULED", "RUNNING", "COMPLETED", "FAILED"], 
        default: "DRAFT" 
    },
    batchSize: { type: Number, default: 30 },
    delayBetweenBatches: { type: Number, default: 10 }, // in minutes
    processedCount: { type: Number, default: 0 },
    nextBatchAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, // Optional for super admins, required for branch managers
    createdAt: { type: Date, default: Date.now }
});

// Indexes for performance
campaignSchema.index({ companyId: 1, branchId: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ scheduledAt: 1 });

const Campaign = mongoose.model("Campaign", campaignSchema);
module.exports = Campaign;

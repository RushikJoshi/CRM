const mongoose = require("mongoose");

const stageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        pipelineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Pipeline",
            required: true
        },
        order: {
            type: Number,
            required: true
        },
        probability: {
            type: Number, // Example: 10, 50, 90 (percent)
            default: 0
        },
        isSystem: {
            type: Boolean,
            default: false // Set to true for default stages like "Won", "Lost"
        },
        winLikelihood: {
            type: String,
            enum: ["open", "won", "lost"],
            default: "open"
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

stageSchema.index({ pipelineId: 1 });
stageSchema.index({ companyId: 1 });

module.exports = mongoose.model("Stage", stageSchema);

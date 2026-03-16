const mongoose = require("mongoose");

const pipelineSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
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

pipelineSchema.index({ companyId: 1 });

module.exports = mongoose.model("Pipeline", pipelineSchema);

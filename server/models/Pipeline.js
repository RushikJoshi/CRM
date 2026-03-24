const mongoose = require("mongoose");

// ── EMBEDDED STAGE SCHEMA ─────────────────────────────────────────────────────
const stageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    order: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        default: "#0ea5e9"
    },
    probability: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
    }
}, { _id: true }); // Keep _id for each stage so leads can reference stage._id

// ── PIPELINE SCHEMA ───────────────────────────────────────────────────────────
// RULE: ONE COMPANY = ONE PIPELINE (enforced via unique index)
const pipelineSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            default: "Main Pipeline"
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            unique: true   // ← Enforces ONE pipeline per company at DB level
        },
        stages: [stageSchema],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
        // isDefault REMOVED — no longer needed (one pipeline per company)
    },
    { timestamps: true }
);

module.exports = mongoose.model("Pipeline", pipelineSchema);

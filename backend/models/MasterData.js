const mongoose = require("mongoose");

const masterDataSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        type: {
            type: String,
            required: true,
            // Types include: lead_source, lead_status, industry, department, 
            // buying_role, deal_stage, call_outcome, meeting_outcome, 
            // task_priority, task_status, customer_type
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
        },
        order: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("MasterData", masterDataSchema);

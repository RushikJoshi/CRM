const mongoose = require("mongoose");

const automationRuleSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true },
    trigger: {
        type: String,
        enum: [
            "lead_created", "lead_assigned", "lead_qualified",
            "deal_created", "deal_stage_changed",
            "task_overdue", "meeting_scheduled"
        ],
        required: true
    },
    conditions: {
        type: Object, // e.g. { lead_source: 'Website' }
        default: {}
    },
    actions: [{
        type: {
            type: String,
            enum: [
                "assign_to_branch", "assign_to_user", "create_notification", "create_task",
                "send_email", "update_lead_score", "move_pipeline_stage"
            ],
            required: true
        },
        params: {
            type: Object, // e.g. { branchId: '...' } or { userId: '...' }
            default: {}
        }
    }],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("AutomationRule", automationRuleSchema);

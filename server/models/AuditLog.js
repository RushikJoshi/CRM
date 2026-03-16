const mongoose = require("mongoose");

/**
 * Enterprise Audit Log – immutable record of all mutation actions for compliance and debugging.
 * Isolated by companyId; Super Admin can query across companies.
 */
const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        action: {
            type: String,
            enum: ["create", "update", "delete"],
            required: true
        },
        objectType: {
            type: String,
            enum: [
                "Lead", "Deal", "Customer", "Contact", "Company", "Branch", "User",
                "Inquiry", "Pipeline", "Stage", "Task", "Call", "Meeting", "Note",
                "AutomationRule", "Notification"
            ],
            required: true
        },
        objectId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            default: null
        },
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            default: null
        },
        changes: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        description: {
            type: String,
            default: ""
        },
        metadata: {
            ip: { type: String, default: null },
            userAgent: { type: String, default: null }
        }
    },
    { timestamps: true }
);

auditLogSchema.index({ companyId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ objectType: 1, objectId: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);

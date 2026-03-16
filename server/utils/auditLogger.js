const Activity = require("../models/Activity");
const AuditLog = require("../models/AuditLog");

/**
 * Audit Logger Utility
 * - logChange: writes to Activity (timeline) for user-facing history
 * - createAuditEntry: writes to AuditLog (enterprise audit trail) for compliance and debugging
 */

const logChange = async ({ leadId, dealId, userId, companyId, oldData, newData, fields }) => {
    try {
        let changes = [];

        fields.forEach(field => {
            const oldValue = oldData[field];
            const newValue = newData[field];

            const oldStr = oldValue?.name || oldValue?.title || String(oldValue ?? "None");
            const newStr = newValue?.name || newValue?.title || String(newValue ?? "None");

            if (oldStr !== newStr) {
                const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1");
                changes.push(`${fieldName} changed from "${oldStr}" to "${newStr}"`);
            }
        });

        if (changes.length > 0) {
            await Activity.create({
                leadId: leadId || null,
                dealId: dealId || null,
                userId,
                companyId,
                type: "system",
                note: changes.join(" | ")
            });
        }
    } catch (error) {
        console.error("Audit Logging Error:", error);
    }
};

/**
 * Create an immutable audit log entry for compliance and debugging.
 * @param {Object} opts - userId, action ('create'|'update'|'delete'), objectType, objectId, companyId?, branchId?, changes?, description?, req? (for ip/userAgent)
 */
const createAuditEntry = async (opts) => {
    try {
        const {
            userId,
            action,
            objectType,
            objectId,
            companyId = null,
            branchId = null,
            changes = null,
            description = "",
            req = null
        } = opts;
        if (!userId || !action || !objectType || !objectId) return;

        const metadata = {};
        if (req) {
            metadata.ip = req.ip || req.connection?.remoteAddress || null;
            metadata.userAgent = req.get?.("user-agent") || null;
        }

        await AuditLog.create({
            userId,
            action,
            objectType,
            objectId,
            companyId,
            branchId,
            changes,
            description,
            metadata
        });
    } catch (error) {
        console.error("AuditLog create error:", error);
    }
};

module.exports = { logChange, createAuditEntry };

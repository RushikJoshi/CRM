const Activity = require("../models/Activity");

/**
 * Audit Logger Utility
 * Automatically logs sensitive field changes to the system activity timeline.
 */
const logChange = async ({ leadId, dealId, userId, companyId, oldData, newData, fields }) => {
    try {
        let changes = [];

        fields.forEach(field => {
            const oldValue = oldData[field];
            const newValue = newData[field];

            // Handle cases where values might be objects (like status.name vs status)
            const oldStr = oldValue?.name || oldValue?.title || String(oldValue || "None");
            const newStr = newValue?.name || newValue?.title || String(newValue || "None");

            if (oldStr !== newStr) {
                // Capitalize field name for better readability
                const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
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

module.exports = { logChange };

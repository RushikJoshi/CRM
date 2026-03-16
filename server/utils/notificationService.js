const Notification = require("../models/Notification");

/**
 * Enterprise Notification Service
 * Dispatches contextual alerts across the organizational hierarchy.
 */
const createNotification = async ({ userId, companyId, title, message, type = "info", link = "" }) => {
    try {
        await Notification.create({
            userId,
            companyId,
            title,
            message,
            type,
            link,
            isRead: false
        });
        return true;
    } catch (error) {
        console.error("Notification Dispatch Error:", error);
        return false;
    }
};

module.exports = { createNotification };

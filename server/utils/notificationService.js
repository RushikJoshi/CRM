const Notification = require("../models/Notification");

/**
 * Enterprise Notification Service
 * Dispatches contextual alerts across the organizational hierarchy.
 */
const createNotification = async ({ userId, companyId, branchId, title, message, type = "info", link = "", req = null }) => {
    try {
        if (!userId) throw new Error("Notification target userId is missing.");

        const notification = await Notification.create({
            userId,
            companyId,
            branchId: branchId || null,
            title,
            message,
            type,
            link,
            isRead: false
        });

        // Trigger real-time broadcast if socket.io is initialized
        if (req && req.app) {
            const io = req.app.get("io");
            if (io) {
                io.to(`user:${userId}`).emit("notification:new", {
                    id: notification._id,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    createdAt: notification.createdAt
                });
            }
        }

        return notification;
    } catch (error) {
        console.error("Notification Dispatch Error:", error.message);
        return false;
    }
};

module.exports = { createNotification };

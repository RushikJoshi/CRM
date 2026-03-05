const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user.id,
            companyId: req.user.companyId
        }).sort({ createdAt: -1 }).limit(30);
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET unread only (used by Navbar badge)
exports.getUnread = async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user.id,
            companyId: req.user.companyId,
            isRead: false
        }).sort({ createdAt: -1 }).limit(20);
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.markRead = async (req, res) => {
    try {
        await Notification.updateOne(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true }
        );
        res.json({ success: true, message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { isRead: true }
        );
        res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

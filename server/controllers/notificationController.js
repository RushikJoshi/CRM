const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        let query = { userId: req.user.id };
        if (req.user.companyId) {
            query.companyId = req.user.companyId;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(30);

        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error("GET NOTIFICATIONS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET unread only (used by Navbar badge)
exports.getUnread = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        let query = {
            userId: req.user.id,
            isRead: false
        };

        // Only add companyId if the user has one (super admins don't)
        if (req.user.companyId) {
            query.companyId = req.user.companyId;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error("GET UNREAD NOTIFICATIONS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
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

const Message = require("../models/Message");
const { createNotification } = require("../utils/notificationService");

exports.sendMessage = async (req, res) => {
    try {
        const { type, recipientNumber, content, leadId, customerId, dealId } = req.body;

        // In a real application, you would integrate Twilio or WhatsApp Business API here.
        // For SaaS demonstration, we'll log it directly.

        let status = "sent";
        // Simulate potential API failure
        if (Math.random() < 0.05) status = "failed";

        const message = await Message.create({
            companyId: req.user.companyId,
            branchId: req.user.branchId || null,
            sentBy: req.user.id,
            type,
            recipientNumber,
            content,
            status,
            leadId: leadId || null,
            customerId: customerId || null,
            dealId: dealId || null
        });

        // Trigger Notification on failure
        if (status === "failed") {
            await createNotification({
                userId: req.user.id,
                companyId: req.user.companyId,
                title: `${type.toUpperCase()} Delivery Failed`,
                message: `Failed to send message to ${recipientNumber}.`,
                type: "error"
            });
            return res.status(400).json({ success: false, message: "Delivery failed by provider.", data: message });
        }

        res.json({ success: true, message: `${type.toUpperCase()} sent & logged.`, data: message });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { leadId, customerId, dealId } = req.query;
        let query = { companyId: req.user.companyId };

        if (req.user.role === "branch_manager" || req.user.role === "sales") {
            query.branchId = req.user.branchId;
        }

        if (leadId) query.leadId = leadId;
        if (customerId) query.customerId = customerId;
        if (dealId) query.dealId = dealId;

        const messages = await Message.find(query)
            .populate("sentBy", "name")
            .sort({ createdAt: -1 });

        res.json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

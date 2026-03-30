const Activity = require("../models/Activity");
const Notification = require("../models/Notification");

/**
 * Enterprise Activity Engine
 * Robust, unified logging for all lead/inquiry interactions.
 */
const logActivity = async ({
    type,
    leadId,
    userId,
    companyId,
    branchId,
    message,
    metadata = {},
    title = null,
    attachments = []
}) => {
    try {
        if (!leadId || !userId || !companyId) {
            console.error("Activity Logging skipped: Missing required fields (leadId, userId, companyId).");
            return null;
        }

        const activity = await Activity.create({
            leadId: leadId, 
            inquiryId: leadId, // Map to both for unified compatibility
            userId,
            companyId,
            branchId: branchId || null,
            type: type.toLowerCase(),
            note: message,
            title: title || metadata?.subject || null,
            attachments: attachments || [],
            previousStage: metadata?.previousStage || null,
            newStage: metadata?.newStage || null,
            metadata: metadata || {}
        });

        // Trigger Notifications for Mentions
        const mentions = metadata?.mentions || [];
        if (mentions.length > 0) {
            const User = require("../models/User");
            const sender = await User.findById(userId).select("name");
            
            for (const mentionId of mentions) {
                await Notification.create({
                    userId: mentionId,
                    companyId,
                    branchId: branchId || null,
                    type: "info",
                    title: "Lead Mention",
                    message: `${sender?.name || 'A teammate'} mentioned you in a ${type} note for a lead.`,
                    metadata: { leadId, activityId: activity._id }
                });
            }
        }

        return activity;
    } catch (error) {
        console.error("Activity Logging Error:", error.message);
        return null;
    }
};

module.exports = { logActivity };

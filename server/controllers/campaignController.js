const Campaign = require("../models/Campaign");
const CampaignLog = require("../models/CampaignLog");
const Inquiry = require("../models/Inquiry");
const mongoose = require("mongoose");

// Create Campaign
exports.createCampaign = async (req, res) => {
    try {
        const {
            name,
            subject,
            message,
            channel,
            audienceType,
            recipients,
            templateId,
            senderProfileId,
            senderName,
            senderEmail,
            previewText,
            recipientMode = "ALL",
            manualRecipients = [],
            scheduledAt,
            batchSize,
            delayBetweenBatches
        } = req.body;
        const { companyId, branchId, id: userId } = req.user;

        // Validation
        if (!name || !message || !channel || !audienceType) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }
        if (channel === "EMAIL" && !subject) {
            return res.status(400).json({ success: false, message: "Email campaigns need a subject." });
        }

        let targetRecipients = Array.isArray(recipients) ? recipients : [];
        let targetManualRecipients = Array.isArray(manualRecipients)
            ? manualRecipients.map((email) => String(email).trim().toLowerCase()).filter(Boolean)
            : [];

        if (recipientMode === "ALL") {
            const query = { companyId, type: audienceType === "LEADS" ? "LEAD" : "INQUIRY", isDeleted: false };
            if (req.user.role === "branch_manager") {
                query.branchId = branchId;
            } else if (branchId) {
                query.branchId = branchId;
            }

            const docs = await Inquiry.find(query).select("_id");
            targetRecipients = docs.map(d => d._id);
        } else if (recipientMode === "SELECTED") {
            targetRecipients = targetRecipients.filter(Boolean);
        } else if (recipientMode === "MANUAL") {
            if (channel !== "EMAIL") {
                return res.status(400).json({ success: false, message: "Manual recipients are currently supported for email only." });
            }
            targetRecipients = [];
        }

        if (recipientMode !== "MANUAL" && targetRecipients.length === 0) {
            return res.status(400).json({ success: false, message: "No recipients found for this audience." });
        }
        if (recipientMode === "MANUAL" && targetManualRecipients.length === 0) {
            return res.status(400).json({ success: false, message: "Add at least one manual email recipient." });
        }

        const campaign = new Campaign({
            name,
            subject: channel === "EMAIL" ? subject : "",
            message,
            channel,
            audienceType,
            templateId: templateId || null,
            senderProfileId: senderProfileId || null,
            senderName: senderName || "",
            senderEmail: senderEmail || "",
            previewText: previewText || "",
            recipientMode,
            manualRecipients: targetManualRecipients,
            recipients: targetRecipients,
            scheduledAt: scheduledAt || new Date(),
            status: scheduledAt ? "SCHEDULED" : "DRAFT",
            batchSize: batchSize || 30,
            delayBetweenBatches: delayBetweenBatches || 10,
            createdBy: userId,
            companyId,
            branchId: req.user.role === "branch_manager" ? branchId : (branchId || null)
        });

        await campaign.save();

        // Create initial pending logs
        const logs = [];
        if (recipientMode === "MANUAL") {
            for (const email of targetManualRecipients) {
                logs.push({
                    campaignId: campaign._id,
                    audienceType,
                    recipient: email,
                    recipientName: "Manual Recipient",
                    status: "PENDING"
                });
            }
        } else {
            for (const rId of targetRecipients) {
                logs.push({
                    campaignId: campaign._id,
                    leadId: rId,
                    audienceType,
                    recipient: "Pending...",
                    status: "PENDING"
                });
            }
        }
        
        if (logs.length > 0) {
            await CampaignLog.insertMany(logs);
        }

        res.status(201).json({ success: true, data: campaign });
    } catch (err) {
        console.error("Create Campaign Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get Campaigns
exports.getCampaigns = async (req, res) => {
    try {
        const { companyId, branchId, role } = req.user;
        const query = { companyId };
        
        if (role === "branch_manager") {
            query.branchId = branchId;
        }

        const campaigns = await Campaign.find(query)
            .populate("senderProfileId", "label fromEmail fromName")
            .populate("templateId", "name category")
            .sort({ createdAt: -1 });

        const campaignIds = campaigns.map((campaign) => campaign._id);
        const groupedStats = campaignIds.length
            ? await CampaignLog.aggregate([
                { $match: { campaignId: { $in: campaignIds } } },
                {
                    $group: {
                        _id: "$campaignId",
                        total: { $sum: 1 },
                        sent: {
                            $sum: {
                                $cond: [{ $in: ["$status", ["SENT", "OPENED", "CLICKED"]] }, 1, 0]
                            }
                        },
                        opened: {
                            $sum: {
                                $cond: [
                                    {
                                        $or: [
                                            { $in: ["$status", ["OPENED", "CLICKED"]] },
                                            { $gt: ["$openedCount", 0] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        clicked: {
                            $sum: {
                                $cond: [
                                    {
                                        $or: [
                                            { $eq: ["$status", "CLICKED"] },
                                            { $gt: ["$clickedCount", 0] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        failed: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0]
                            }
                        },
                        pending: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0]
                            }
                        },
                        lastOpenedAt: { $max: "$openedAt" },
                        lastClickedAt: { $max: "$clickedAt" }
                    }
                }
            ])
            : [];

        const statsMap = new Map(groupedStats.map((item) => [String(item._id), item]));
        const campaignPayload = campaigns.map((campaign) => {
            const stats = statsMap.get(String(campaign._id)) || {
                total: 0,
                sent: 0,
                opened: 0,
                clicked: 0,
                failed: 0,
                pending: 0,
                lastOpenedAt: null,
                lastClickedAt: null,
            };

            return {
                ...campaign.toObject(),
                stats,
            };
        });

        res.json({ success: true, data: campaignPayload });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get Campaign by ID
exports.getCampaignById = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate("senderProfileId", "label fromEmail fromName")
            .populate("templateId", "name subject category previewText");
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
        
        const logs = await CampaignLog.find({ campaignId: campaign._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: { campaign, logs } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get Audience Count (Helper for UI)
exports.getAudienceCount = async (req, res) => {
    try {
        const { type } = req.query; // LEADS or INQUIRIES
        const { companyId, branchId, role } = req.user;

        const query = { 
            companyId, 
            type: type === "LEADS" ? "LEAD" : "INQUIRY", 
            isDeleted: false 
        };

        if (role === "branch_manager") {
            query.branchId = branchId;
        }

        const count = await Inquiry.countDocuments(query);
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const Campaign = require("../models/Campaign");
const CampaignLog = require("../models/CampaignLog");
const Inquiry = require("../models/Inquiry");
const mongoose = require("mongoose");

// Create Campaign
exports.createCampaign = async (req, res) => {
    try {
        const { name, message, channel, audienceType, recipients, scheduledAt, batchSize, delayBetweenBatches } = req.body;
        const { companyId, branchId, id: userId } = req.user;

        // Validation
        if (!name || !message || !channel || !audienceType) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // Audience Logic: if recipients is empty, fetch all based on audienceType
        let targetRecipients = recipients;
        if (!targetRecipients || targetRecipients.length === 0) {
            const query = { companyId, type: audienceType === "LEADS" ? "LEAD" : "INQUIRY", isDeleted: false };
            if (req.user.role === "branch_manager") {
                query.branchId = branchId;
            } else if (branchId) {
                query.branchId = branchId;
            }
            
            const docs = await Inquiry.find(query).select("_id");
            targetRecipients = docs.map(d => d._id);
        }

        if (targetRecipients.length === 0) {
            return res.status(400).json({ success: false, message: "No recipients found for this audience." });
        }

        const campaign = new Campaign({
            name,
            message,
            channel,
            audienceType,
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
        for (const rId of targetRecipients) {
            // We'll fetch actual phone/email during processing to ensure data is fresh, 
            // but for tracking we initialize logs
            logs.push({
                campaignId: campaign._id,
                leadId: rId,
                audienceType,
                recipient: "Pending...", // Placeholder
                status: "PENDING"
            });
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

        const campaigns = await Campaign.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: campaigns });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get Campaign by ID
exports.getCampaignById = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
        
        const logs = await CampaignLog.find({ campaignId: campaign._id });
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

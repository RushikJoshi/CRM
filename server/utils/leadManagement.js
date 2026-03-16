const Lead = require("../models/Lead");
const User = require("../models/User");
const Call = require("../models/Call");
const Meeting = require("../models/Meeting");

/**
 * AI Lead Scoring Engine
 * Calculates score based on activity intensity and profile completeness.
 */
const calculateLeadScore = async (leadId) => {
    try {
        const lead = await Lead.findById(leadId);
        if (!lead) return 0;

        let score = 0;

        // 1. Source Weight
        const sourceMap = {
            'Website': 20,
            'Ad': 15,
            'Phone': 10,
            'Email': 5,
            'Walk-in': 10
        };
        // If source is a name (from MasterData) or static string
        const sourceName = lead.source?.name || lead.source;
        score += sourceMap[sourceName] || 0;

        // 2. Profile Quality
        if (lead.email) score += 5;
        if (lead.phone) score += 5;
        if (lead.companyName) score += 10;
        if (lead.value > 100000) score += 15;

        // 3. Activity Intensity
        const callCount = await Call.countDocuments({ leadId: lead._id });
        const meetingCount = await Meeting.countDocuments({ leadId: lead._id });

        score += callCount * 10;
        score += meetingCount * 25;

        // Cap at 100
        score = Math.min(score, 100);

        lead.score = score;

        // Update priority based on score categories
        if (score >= 60) lead.priority = "high";
        else if (score >= 30) lead.priority = "medium";
        else lead.priority = "low";

        await lead.save();
        return score;
    } catch (error) {
        console.error("Scoring Error:", error);
        return 0;
    }
};

/**
 * Automatic Lead Assignment (Round Robin)
 */
const assignLeadAutomatically = async (leadId, companyId, branchId = null) => {
    try {
        const lead = await Lead.findById(leadId);
        if (!lead) return;

        // Get available sales users
        let query = { companyId, role: "sales", status: "active" };
        if (branchId) query.branchId = branchId;

        const users = await User.find(query).sort({ lastAssignedAt: 1 });
        if (users.length === 0) return;

        const assignedUser = users[0];
        lead.assignedTo = assignedUser._id;
        await lead.save();

        // Update user's last assignment time to maintain round robin
        assignedUser.lastAssignedAt = new Date();
        await assignedUser.save();

        return assignedUser;
    } catch (error) {
        console.error("Assignment Error:", error);
    }
};

module.exports = { calculateLeadScore, assignLeadAutomatically };

const Deal = require("../models/Deal");
const Lead = require("../models/Lead");
const User = require("../models/User");
const Company = require("../models/Company");

exports.getRevenueByMonth = async (req, res) => {
    try {
        console.log(`Report Access: role=${req.user.role}, companyId=${req.user.companyId}, path=revenue`);
        const match = { stage: "Closed Won" };
        if (req.user.role !== "super_admin") {
            match.companyId = req.user.companyId;
            if (req.user.role === "branch_manager") match.branchId = req.user.branchId;
        }

        const data = await Deal.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    revenue: { $sum: "$value" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getDealsByStage = async (req, res) => {
    try {
        console.log(`Report Access: role=${req.user.role}, path=deals-by-stage`);
        const match = {};
        if (req.user.role !== "super_admin") {
            match.companyId = req.user.companyId;
            if (req.user.role === "branch_manager") match.branchId = req.user.branchId;
        }

        const data = await Deal.aggregate([
            { $match: match },
            { $group: { _id: "$stage", count: { $sum: 1 } } }
        ]);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLeadConversions = async (req, res) => {
    try {
        console.log(`Report Access: role=${req.user.role}, path=lead-conversions`);
        let filter = {};
        if (req.user.role !== "super_admin") {
            filter.companyId = req.user.companyId;
            if (req.user.role === "branch_manager") filter.branchId = req.user.branchId;
        }

        const total = await Lead.countDocuments(filter);
        const converted = await Lead.countDocuments({ ...filter, isConverted: true });
        res.json({ total, converted });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserPerformance = async (req, res) => {
    try {
        const match = { stage: "Closed Won" };
        if (req.user.role !== "super_admin") {
            match.companyId = req.user.companyId;
            if (req.user.role === "branch_manager") match.branchId = req.user.branchId;
        }

        const data = await Deal.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$assignedTo",
                    deals: { $sum: 1 },
                    totalValue: { $sum: "$value" }
                }
            }
        ]);
        await User.populate(data, { path: "_id", select: "name" });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getDealForecasting = async (req, res) => {
    try {
        const match = {};
        if (req.user.role !== "super_admin") {
            match.companyId = req.user.companyId;
            if (req.user.role === "branch_manager") match.branchId = req.user.branchId;
        }

        const data = await Deal.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$stage",
                    totalValue: { $sum: "$value" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Calculate expected revenue weighted by stage probability
        const probabilities = {
            "New": 0.1,
            "Qualified": 0.3,
            "Proposal": 0.6,
            "Negotiation": 0.8,
            "Closed Won": 1.0,
            "Closed Lost": 0.0
        };

        const forecast = data.map(group => ({
            stage: group._id,
            weightedValue: group.totalValue * (probabilities[group._id] || 0.1),
            actualValue: group.totalValue
        }));

        res.json(forecast);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

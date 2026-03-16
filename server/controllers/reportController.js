const Deal = require("../models/Deal");
const Lead = require("../models/Lead");
const User = require("../models/User");
const Company = require("../models/Company");

exports.getRevenueByMonth = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
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
        res.json({ success: true, data });
    } catch (error) {
        console.error("GET REVENUE BY MONTH ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDealsByStage = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
        const match = {};
        if (req.user.role !== "super_admin") {
            match.companyId = req.user.companyId;
            if (req.user.role === "branch_manager") match.branchId = req.user.branchId;
        }

        const data = await Deal.aggregate([
            { $match: match },
            { $group: { _id: "$stage", count: { $sum: 1 } } }
        ]);
        res.json({ success: true, data });
    } catch (error) {
        console.error("GET DEALS BY STAGE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLeadConversions = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
        let filter = {};
        if (req.user.role !== "super_admin") {
            filter.companyId = req.user.companyId;
            if (req.user.role === "branch_manager") filter.branchId = req.user.branchId;
        }

        const total = await Lead.countDocuments(filter);
        const converted = await Lead.countDocuments({ ...filter, isConverted: true });
        res.json({ success: true, data: { total, converted } });
    } catch (error) {
        console.error("GET LEAD CONVERSIONS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserPerformance = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
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
        res.json({ success: true, data });
    } catch (error) {
        console.error("GET USER PERFORMANCE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDealForecasting = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
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

        res.json({ success: true, data: forecast });
    } catch (error) {
        console.error("GET DEAL FORECASTING ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const Target = require("../models/Target");
const User = require("../models/User");
const Deal = require("../models/Deal");
const Lead = require("../models/Lead");
const Call = require("../models/Call");
const Meeting = require("../models/Meeting");

// ── Helper: Get start/end of a given month ────────────────────────────────────
const getMonthRange = (year, month) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
};

// ══════════════════════════════════════════════════════════
// SET / UPDATE a target for a specific sales rep
// POST /api/targets
// PATCH /api/targets/:id
// ══════════════════════════════════════════════════════════
exports.setTarget = async (req, res) => {
    try {
        const { role, branchId, companyId } = req.user;

        if (role !== "branch_manager" && role !== "company_admin") {
            return res.status(403).json({ success: false, message: "Only Branch Managers or Company Admins can set targets." });
        }

        const { assignedTo, month, year, revenueTarget, leadsTarget, dealsTarget, callsTarget, meetingsTarget, notes } = req.body;

        if (!assignedTo || !month || !year) {
            return res.status(400).json({ success: false, message: "assignedTo, month, and year are required." });
        }

        const filter = {
            assignedTo,
            month: Number(month),
            year: Number(year),
            branchId: branchId || req.body.branchId
        };

        const update = {
            setBy: req.user.id,
            companyId,
            branchId: branchId || req.body.branchId,
            revenueTarget: Number(revenueTarget) || 0,
            leadsTarget: Number(leadsTarget) || 0,
            dealsTarget: Number(dealsTarget) || 0,
            callsTarget: Number(callsTarget) || 0,
            meetingsTarget: Number(meetingsTarget) || 0,
            notes: notes || ""
        };

        const target = await Target.findOneAndUpdate(
            filter,
            { $set: update },
            { new: true, upsert: true, runValidators: true }
        ).populate("assignedTo", "name email role");

        res.json({ success: true, message: "Target saved successfully.", data: target });
    } catch (err) {
        console.error("setTarget error:", err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: "A target for this user/month/year already exists." });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// ══════════════════════════════════════════════════════════
// GET all targets for the branch (with achievement data)
// GET /api/targets
// ══════════════════════════════════════════════════════════
exports.getTargets = async (req, res) => {
    try {
        const { role, branchId, companyId } = req.user;
        const { month, year } = req.query;

        const currentDate = new Date();
        const queryMonth = Number(month) || currentDate.getMonth() + 1;
        const queryYear = Number(year) || currentDate.getFullYear();

        let filter = { month: queryMonth, year: queryYear };

        if (role === "branch_manager") {
            filter.branchId = branchId;
        } else if (role === "company_admin") {
            filter.companyId = companyId;
            if (req.query.branchId) filter.branchId = req.query.branchId;
        } else if (role === "sales") {
            filter.assignedTo = req.user.id;
        } else {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const targets = await Target.find(filter)
            .populate("assignedTo", "name email role")
            .populate("branchId", "name")
            .sort({ createdAt: -1 });

        // Now calculate achievements for each target
        const { start, end } = getMonthRange(queryYear, queryMonth);

        const enriched = await Promise.all(targets.map(async (t) => {
            const userId = t.assignedTo._id;

            const userBranchFilter = { assignedTo: userId };

            const [dealsWon, leadsConverted, callsMade, meetingsDone] = await Promise.all([
                Deal.countDocuments({ ...userBranchFilter, stage: { $in: ["Won", "Closed Won"] }, updatedAt: { $gte: start, $lte: end } }),
                Lead.countDocuments({ ...userBranchFilter, status: { $in: ["Won", "Qualified"] }, updatedAt: { $gte: start, $lte: end } }),
                Call.countDocuments({ ...userBranchFilter, createdAt: { $gte: start, $lte: end } }),
                Meeting.countDocuments({ ...userBranchFilter, createdAt: { $gte: start, $lte: end } })
            ]);

            const revenueData = await Deal.aggregate([
                { $match: { assignedTo: userId, stage: { $in: ["Won", "Closed Won"] }, updatedAt: { $gte: start, $lte: end } } },
                { $group: { _id: null, total: { $sum: "$value" } } }
            ]);
            const revenueAchieved = revenueData.length > 0 ? revenueData[0].total : 0;

            return {
                ...t.toObject(),
                achievement: {
                    revenueAchieved,
                    leadsAchieved: leadsConverted,
                    dealsAchieved: dealsWon,
                    callsAchieved: callsMade,
                    meetingsAchieved: meetingsDone
                }
            };
        }));

        res.json({ success: true, data: enriched, meta: { month: queryMonth, year: queryYear } });
    } catch (err) {
        console.error("getTargets error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ══════════════════════════════════════════════════════════
// GET my own target (for Sales Rep view)
// GET /api/targets/my
// ══════════════════════════════════════════════════════════
exports.getMyTarget = async (req, res) => {
    try {
        const currentDate = new Date();
        const month = Number(req.query.month) || currentDate.getMonth() + 1;
        const year = Number(req.query.year) || currentDate.getFullYear();

        const target = await Target.findOne({
            assignedTo: req.user.id,
            month,
            year
        }).populate("setBy", "name");

        if (!target) {
            return res.json({ success: true, data: null, message: "No target set for this period." });
        }

        const { start, end } = getMonthRange(year, month);
        const userId = req.user.id;

        const [dealsWon, leadsConverted, callsMade, meetingsDone, revenueData] = await Promise.all([
            Deal.countDocuments({ assignedTo: userId, stage: { $in: ["Won", "Closed Won"] }, updatedAt: { $gte: start, $lte: end } }),
            Lead.countDocuments({ assignedTo: userId, status: { $in: ["Won", "Qualified"] }, updatedAt: { $gte: start, $lte: end } }),
            Call.countDocuments({ assignedTo: userId, createdAt: { $gte: start, $lte: end } }),
            Meeting.countDocuments({ assignedTo: userId, createdAt: { $gte: start, $lte: end } }),
            Deal.aggregate([
                { $match: { assignedTo: new require("mongoose").Types.ObjectId(userId), stage: { $in: ["Won", "Closed Won"] }, updatedAt: { $gte: start, $lte: end } } },
                { $group: { _id: null, total: { $sum: "$value" } } }
            ])
        ]);

        const revenueAchieved = revenueData.length > 0 ? revenueData[0].total : 0;

        res.json({
            success: true,
            data: {
                ...target.toObject(),
                achievement: {
                    revenueAchieved,
                    leadsAchieved: leadsConverted,
                    dealsAchieved: dealsWon,
                    callsAchieved: callsMade,
                    meetingsAchieved: meetingsDone
                }
            }
        });
    } catch (err) {
        console.error("getMyTarget error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ══════════════════════════════════════════════════════════
// DELETE a target
// DELETE /api/targets/:id
// ══════════════════════════════════════════════════════════
exports.deleteTarget = async (req, res) => {
    try {
        const { role, branchId } = req.user;
        if (role !== "branch_manager" && role !== "company_admin") {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const target = await Target.findByIdAndDelete(req.params.id);
        if (!target) return res.status(404).json({ success: false, message: "Target not found." });

        res.json({ success: true, message: "Target deleted." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ══════════════════════════════════════════════════════════
// GET team members that can be assigned targets
// GET /api/targets/team
// ══════════════════════════════════════════════════════════
exports.getTeamMembers = async (req, res) => {
    try {
        const { role, branchId, companyId } = req.user;

        if (role !== "branch_manager" && role !== "company_admin") {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const filter = { companyId, role: "sales", status: "active" };
        if (role === "branch_manager" && branchId) filter.branchId = branchId;

        const members = await User.find(filter).select("name email role branchId").populate("branchId", "name");
        res.json({ success: true, data: members });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

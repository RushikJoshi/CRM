const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const User = require("../models/User");
const Call = require("../models/Call");
const Meeting = require("../models/Meeting");
const Todo = require("../models/Todo");

// ─── Util: Safe ObjectId ──────────────────────────────────────────────────────
const toOid = (id) => {
    try { return id ? new mongoose.Types.ObjectId(String(id)) : null; } catch { return null; }
};

// ─── Util: Get this month's date range ───────────────────────────────────────
const thisMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
};

// ─── Util: Get last N months ─────────────────────────────────────────────────
const lastNMonths = (n = 6) => {
    const months = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            label: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
            start: new Date(d.getFullYear(), d.getMonth(), 1),
            end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
        });
    }
    return months;
};

// ══════════════════════════════════════════════════════════════════
// GET /api/branch-analytics  
// Branch Analytics: Funnel, Revenue Trend, Lead Sources, Rep Breakdown
// ══════════════════════════════════════════════════════════════════
exports.getBranchAnalytics = async (req, res) => {
    try {
        const { role, branchId, companyId } = req.user;
        if (!["branch_manager", "company_admin"].includes(role)) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const branchOid = toOid(branchId);
        const companyOid = toOid(companyId);
        const { start: monthStart, end: monthEnd } = thisMonthRange();
        const months = lastNMonths(6);

        // Base match filters
        const leadBase = { companyId: companyOid, isDeleted: false };
        const dealBase = { companyId: companyOid };
        if (role === "branch_manager" && branchOid) {
            leadBase.branchId = branchOid;
            dealBase.branchId = branchOid;
        }

        // ── 1. Conversion Funnel ──────────────────────────────────────────────
        const [totalLeads, qualified, proposal, negotiation, won, lost] = await Promise.all([
            Lead.countDocuments({ ...leadBase }),
            Lead.countDocuments({ ...leadBase, status: /qualified/i }),
            Lead.countDocuments({ ...leadBase, status: /proposal/i }),
            Lead.countDocuments({ ...leadBase, status: /negotiation/i }),
            Lead.countDocuments({ ...leadBase, status: { $in: ["Won", "Closed Won"] } }),
            Lead.countDocuments({ ...leadBase, status: { $in: ["Lost", "Closed Lost"] } }),
        ]);

        const funnel = [
            { stage: "Total Leads", count: totalLeads, color: "#6366f1" },
            { stage: "Qualified", count: qualified, color: "#8b5cf6" },
            { stage: "Proposal", count: proposal, color: "#f59e0b" },
            { stage: "Negotiation", count: negotiation, color: "#ef4444" },
            { stage: "Won", count: won, color: "#22c55e" },
        ];

        // ── 2. Revenue Trend (last 6 months) ─────────────────────────────────
        const revenueTrendRaw = await Deal.aggregate([
            { $match: { ...dealBase, stage: { $in: ["Won", "Closed Won"] } } },
            {
                $group: {
                    _id: { year: { $year: "$updatedAt" }, month: { $month: "$updatedAt" } },
                    revenue: { $sum: "$value" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const revenueTrend = months.map(m => {
            const match = revenueTrendRaw.find(r =>
                r._id.year === m.start.getFullYear() && r._id.month === m.start.getMonth() + 1
            );
            return { month: m.label, revenue: match?.revenue || 0, deals: match?.count || 0 };
        });

        // ── 3. Lead Sources Breakdown ─────────────────────────────────────────
        const sourceBreakdown = await Lead.aggregate([
            { $match: leadBase },
            { $group: { _id: { $ifNull: ["$source", "Unknown"] }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 }
        ]);

        // ── 4. This Month KPIs ────────────────────────────────────────────────
        const [monthLeads, monthDeals, monthRevArr, monthCalls, monthMeetings] = await Promise.all([
            Lead.countDocuments({ ...leadBase, createdAt: { $gte: monthStart, $lte: monthEnd } }),
            Deal.countDocuments({ ...dealBase, stage: { $in: ["Won", "Closed Won"] }, updatedAt: { $gte: monthStart, $lte: monthEnd } }),
            Deal.aggregate([
                { $match: { ...dealBase, stage: { $in: ["Won", "Closed Won"] }, updatedAt: { $gte: monthStart, $lte: monthEnd } } },
                { $group: { _id: null, total: { $sum: "$value" } } }
            ]),
            Call.countDocuments({ companyId: companyOid, ...(role === "branch_manager" && branchOid ? { branchId: branchOid } : {}), createdAt: { $gte: monthStart, $lte: monthEnd } }),
            Meeting.countDocuments({ companyId: companyOid, ...(role === "branch_manager" && branchOid ? { branchId: branchOid } : {}), createdAt: { $gte: monthStart, $lte: monthEnd } }),
        ]);
        const monthRevenue = monthRevArr[0]?.total || 0;

        // ── 5. Lead Status Distribution ───────────────────────────────────────
        const statusDist = await Lead.aggregate([
            { $match: leadBase },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // ── 6. Deal Stage Pipeline Value ──────────────────────────────────────
        const pipelineByStage = await Deal.aggregate([
            { $match: { ...dealBase, stage: { $nin: ["Won", "Closed Won", "Lost", "Closed Lost"] } } },
            { $group: { _id: "$stage", value: { $sum: "$value" }, count: { $sum: 1 } } },
            { $sort: { value: -1 } }
        ]);

        // ── 7. Leads Created per day (this month) ─────────────────────────────
        const leadsPerDay = await Lead.aggregate([
            { $match: { ...leadBase, createdAt: { $gte: monthStart, $lte: monthEnd } } },
            { $group: { _id: { $dayOfMonth: "$createdAt" }, count: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        res.json({
            success: true,
            data: {
                funnel,
                revenueTrend,
                sourceBreakdown: sourceBreakdown.map(s => ({ source: s._id, count: s.count })),
                statusDistribution: statusDist.map(s => ({ status: s._id, count: s.count })),
                pipelineByStage: pipelineByStage.map(p => ({ stage: p._id, value: p.value, count: p.count })),
                leadsPerDay: leadsPerDay.map(d => ({ day: d._id, count: d.count })),
                kpis: {
                    monthLeads,
                    monthDeals,
                    monthRevenue,
                    monthCalls,
                    monthMeetings,
                    conversionRate: totalLeads > 0 ? ((won / totalLeads) * 100).toFixed(1) : 0,
                    lostRate: totalLeads > 0 ? ((lost / totalLeads) * 100).toFixed(1) : 0,
                }
            }
        });
    } catch (err) {
        console.error("getBranchAnalytics error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ══════════════════════════════════════════════════════════════════
// GET /api/branch-analytics/leaderboard
// Team Leaderboard with Badges
// ══════════════════════════════════════════════════════════════════
exports.getLeaderboard = async (req, res) => {
    try {
        const { role, branchId, companyId } = req.user;
        if (!["branch_manager", "company_admin"].includes(role)) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const branchOid = toOid(branchId);
        const companyOid = toOid(companyId);
        const { start: monthStart, end: monthEnd } = thisMonthRange();

        // Get all active sales reps in this branch/company
        const repFilter = { companyId, role: "sales", status: "active" };
        if (role === "branch_manager" && branchId) repFilter.branchId = branchId;
        const reps = await User.find(repFilter).select("name email branchId lastAssignedAt");

        if (reps.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const repIds = reps.map(r => r._id);

        // Fetch all metrics for all reps in parallel
        const [dealsWonAgg, revenueAgg, leadsAgg, callsAgg, meetingsAgg, activeLeadsAgg] = await Promise.all([
            // Deals Won this month
            Deal.aggregate([
                { $match: { assignedTo: { $in: repIds }, stage: { $in: ["Won", "Closed Won"] }, updatedAt: { $gte: monthStart, $lte: monthEnd } } },
                { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
            ]),
            // Revenue Won this month
            Deal.aggregate([
                { $match: { assignedTo: { $in: repIds }, stage: { $in: ["Won", "Closed Won"] }, updatedAt: { $gte: monthStart, $lte: monthEnd } } },
                { $group: { _id: "$assignedTo", total: { $sum: "$value" } } }
            ]),
            // Leads Assigned this month
            Lead.aggregate([
                { $match: { assignedTo: { $in: repIds }, isDeleted: false, createdAt: { $gte: monthStart, $lte: monthEnd } } },
                { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
            ]),
            // Calls made this month
            Call.aggregate([
                { $match: { createdBy: { $in: repIds }, createdAt: { $gte: monthStart, $lte: monthEnd } } },
                { $group: { _id: "$createdBy", count: { $sum: 1 } } }
            ]),
            // Meetings done this month
            Meeting.aggregate([
                { $match: { createdBy: { $in: repIds }, createdAt: { $gte: monthStart, $lte: monthEnd } } },
                { $group: { _id: "$createdBy", count: { $sum: 1 } } }
            ]),
            // Active leads (assigned & not won/lost)
            Lead.aggregate([
                { $match: { assignedTo: { $in: repIds }, isDeleted: false, status: { $nin: ["Won", "Closed Won", "Lost", "Closed Lost"] } } },
                { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
            ])
        ]);

        // Merge all data into rep stats
        const lookup = (agg, repId) => {
            const match = agg.find(a => a._id?.toString() === repId.toString());
            return match ? (match.count ?? match.total ?? 0) : 0;
        };

        const leaderboard = reps.map(rep => {
            const dealsWon = lookup(dealsWonAgg, rep._id);
            const revenue = lookup(revenueAgg, rep._id);
            const leads = lookup(leadsAgg, rep._id);
            const calls = lookup(callsAgg, rep._id);
            const meetings = lookup(meetingsAgg, rep._id);
            const activeLeads = lookup(activeLeadsAgg, rep._id);

            // Performance Score = Revenue (50%) + Deals (30%) + Activity (20%)
            const score = Math.round(revenue * 0.0001 + dealsWon * 30 + calls * 2 + meetings * 5);

            return {
                _id: rep._id,
                name: rep.name,
                email: rep.email,
                dealsWon,
                revenue,
                leads,
                calls,
                meetings,
                activeLeads,
                score
            };
        });

        // Sort by score descending
        leaderboard.sort((a, b) => b.score - a.score);

        // Assign ranks and badges
        const BADGES = [
            { minScore: 500, badge: "🏆 Top Closer", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
            { minScore: 200, badge: "🥈 High Performer", color: "text-slate-600 bg-slate-50 border-slate-200" },
            { minScore: 100, badge: "🥉 Rising Star", color: "text-orange-600 bg-orange-50 border-orange-200" },
            { minScore: 50, badge: "⚡ Active Rep", color: "text-blue-600 bg-blue-50 border-blue-200" },
            { minScore: 0, badge: "🌱 Getting Started", color: "text-green-600 bg-green-50 border-green-200" },
        ];

        const enriched = leaderboard.map((rep, idx) => ({
            ...rep,
            rank: idx + 1,
            ...BADGES.find(b => rep.score >= b.minScore)
        }));

        res.json({ success: true, data: enriched, month: new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }) });
    } catch (err) {
        console.error("getLeaderboard error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ══════════════════════════════════════════════════════════════════
// GET /api/branch-analytics/auto-assign/status
// Get current round-robin assignment queue status
// POST /api/branch-analytics/auto-assign/redistribute
// Redistribute all unassigned leads evenly
// ══════════════════════════════════════════════════════════════════
exports.getAssignmentStatus = async (req, res) => {
    try {
        const { role, branchId, companyId } = req.user;
        if (!["branch_manager", "company_admin"].includes(role)) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const repFilter = { companyId, role: "sales", status: "active" };
        if (role === "branch_manager" && branchId) repFilter.branchId = branchId;

        const reps = await User.find(repFilter).select("name email lastAssignedAt");
        const repIds = reps.map(r => r._id);

        // Count active leads per rep
        const activeLeadCounts = await Lead.aggregate([
            { $match: { assignedTo: { $in: repIds }, isDeleted: false, status: { $nin: ["Won", "Closed Won", "Lost", "Closed Lost"] } } },
            { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
        ]);

        const unassignedCount = await Lead.countDocuments({
            companyId,
            isDeleted: false,
            assignedTo: null,
            ...(branchId ? { branchId } : {})
        });

        const statusData = reps.map(rep => ({
            _id: rep._id,
            name: rep.name,
            email: rep.email,
            lastAssignedAt: rep.lastAssignedAt,
            activeLeads: activeLeadCounts.find(a => a._id?.toString() === rep._id.toString())?.count || 0
        })).sort((a, b) => a.activeLeads - b.activeLeads);

        res.json({ success: true, data: { reps: statusData, unassignedLeads: unassignedCount } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.redistributeLeads = async (req, res) => {
    try {
        const { role, branchId, companyId } = req.user;
        if (!["branch_manager", "company_admin"].includes(role)) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const repFilter = { companyId, role: "sales", status: "active" };
        if (role === "branch_manager" && branchId) repFilter.branchId = branchId;

        const reps = await User.find(repFilter).sort({ lastAssignedAt: 1 });
        if (reps.length === 0) {
            return res.status(400).json({ success: false, message: "No active sales reps in this branch." });
        }

        const unassignedLeads = await Lead.find({
            companyId,
            isDeleted: false,
            assignedTo: null,
            ...(branchId ? { branchId } : {})
        });

        let assignedCount = 0;
        for (let i = 0; i < unassignedLeads.length; i++) {
            const rep = reps[i % reps.length];
            await Lead.findByIdAndUpdate(unassignedLeads[i]._id, { assignedTo: rep._id });
            rep.lastAssignedAt = new Date();
            await rep.save();
            assignedCount++;
        }

        res.json({
            success: true,
            message: `Successfully distributed ${assignedCount} leads across ${reps.length} sales reps.`,
            data: { totalDistributed: assignedCount, repsCount: reps.length }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

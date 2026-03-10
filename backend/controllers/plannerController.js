const Call = require("../models/Call");
const Meeting = require("../models/Meeting");
const Todo = require("../models/Todo");
const Lead = require("../models/Lead");
const Activity = require("../models/Activity");
const mongoose = require("mongoose");

// ── GET DAILY PLANNER DATA ──────────────────────────────────────────────────
exports.getDailyPlanner = async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = req.user.companyId;

        // Today's range (start and end)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Fetch Today's & Overdue Agenda (Calls & Meetings)
        const [todayCalls, todayMeetings] = await Promise.all([
            Call.find({
                companyId,
                assignedTo: userId,
                status: { $ne: "Closed" },
                startDate: { $lte: endOfDay }
            }).populate("leadId", "name phone").sort({ startDate: 1 }),

            Meeting.find({
                companyId,
                assignedTo: userId,
                status: { $ne: "Closed" },
                startDate: { $lte: endOfDay }
            }).populate("leadId", "name phone").sort({ startDate: 1 })
        ]);

        // 2. Fetch Today's & Overdue Tasks
        const tasks = await Todo.find({
            companyId,
            assignedTo: userId,
            status: { $in: ["Pending", "In Progress"] },
            dueDate: { $lte: endOfDay }
        }).populate("leadId", "name").sort({ dueDate: 1, priority: -1 });

        // 3. High Priority & Untouched Leads (Stale Leads)
        // Leads assigned to user that haven't been touched in 3 days
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const staleLeads = await Lead.find({
            companyId,
            assignedTo: userId,
            isConverted: false,
            isDeleted: false,
            status: { $nin: ["Closed Lost", "Closed Won"] },
            updatedAt: { $lte: threeDaysAgo }
        }).sort({ updatedAt: 1 }).limit(10);

        // 4. Summarize Stats for the circular rings
        const totalPending = tasks.length + todayCalls.length + todayMeetings.length;
        const highPriorityTasks = tasks.filter(t => t.priority === "High").length;

        res.json({
            success: true,
            data: {
                agenda: {
                    calls: todayCalls,
                    meetings: todayMeetings
                },
                tasks,
                staleLeads,
                stats: {
                    totalPending,
                    highPriorityTasks,
                    staleCount: staleLeads.length
                }
            }
        });

    } catch (error) {
        console.error("PLANNER ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET SALES VELOCITY / PERFORMANCE (Simple version for Rep) ───────────────
exports.getPersonalStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = req.user.companyId;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Simple aggregation for this month
        const [leadsCount, convertedCount, totalRevenue] = await Promise.all([
            Lead.countDocuments({ companyId, assignedTo: userId, createdAt: { $gte: startOfMonth } }),
            Lead.countDocuments({ companyId, assignedTo: userId, isConverted: true, convertedAt: { $gte: startOfMonth } }),
            Lead.aggregate([
                { $match: { companyId, assignedTo: userId, isConverted: true, convertedAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: "$value" } } }
            ])
        ]);

        const revenue = totalRevenue[0]?.total || 0;
        const conversionRate = leadsCount > 0 ? Math.round((convertedCount / leadsCount) * 100) : 0;

        res.json({
            success: true,
            data: {
                leadsCount,
                convertedCount,
                revenue,
                conversionRate
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const Todo = require("../models/Todo");
const Lead = require("../models/Lead");
const Activity = require("../models/Activity");

// ── CREATE TASK ──────────────────────────────────────────────────────────────
exports.createTask = async (req, res) => {
    try {
        const data = await Todo.create({
            ...req.body,
            companyId: req.user.companyId,
            branchId: req.user.branchId || null,
            createdBy: req.user.id,
            assignedTo: req.body.assignedTo || req.user.id
        });

        // LOG ACTIVITY
        if (data.leadId || data.dealId || data.customerId) {
            await Activity.create({
                leadId: data.leadId || null,
                dealId: data.dealId || null,
                customerId: data.customerId || null,
                userId: req.user.id,
                companyId: req.user.companyId,
                type: "system",
                note: `Task Scheduled: ${data.title}`
            });
        }

        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error("CREATE TASK ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET TASKS ─────────────────────────────────────────────────────────────────
exports.getTasks = async (req, res) => {
    try {
        const { leadId, dealId, customerId, page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        let query = { companyId: req.user.companyId };

        if (req.user.role === "sales") query.assignedTo = req.user.id;
        if (req.user.role === "branch_manager") query.branchId = req.user.branchId;

        if (leadId) query.leadId = leadId;
        if (dealId) query.dealId = dealId;
        if (customerId) query.customerId = customerId;

        const [total, tasks] = await Promise.all([
            Todo.countDocuments(query),
            Todo.find(query)
                .populate("leadId", "name email phone companyName")
                .populate("dealId", "title value")
                .populate("customerId", "name")
                .populate("assignedTo", "name")
                .sort({ dueDate: 1 })
                .skip(skip)
                .limit(limitNum)
        ]);

        res.json({
            success: true,
            data: tasks,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        console.error("GET TASKS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── UPDATE TASK STATUS ────────────────────────────────────────────────────────
exports.updateTaskStatus = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.user.companyId };
        const before = await Todo.findOne(query);
        if (!before) return res.status(404).json({ success: false, message: "Task not found" });

        const updated = await Todo.findOneAndUpdate(
            query,
            req.body,
            { new: true }
        );

        // LOG ACTIVITY IF STATUS CHANGED
        if (req.body.status) {
            await Activity.create({
                leadId: updated.leadId || null,
                dealId: updated.dealId || null,
                customerId: updated.customerId || null,
                userId: req.user.id,
                companyId: req.user.companyId,
                type: "system",
                note: `Task ${updated.status}: ${updated.title}`
            });

            // Trigger automation for overdue tasks
            if (req.body.status === "Overdue") {
                const { runAutomation } = require("../utils/automationEngine");
                await runAutomation("task_overdue", req.user.companyId, {
                    record: updated,
                    userId: req.user.id,
                    previousStatus: before.status,
                    newStatus: updated.status
                });
            }
        }

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error("UPDATE TASK ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


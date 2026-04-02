const Meeting = require("../models/Meeting");
const Activity = require("../models/Activity");
const { runAutomation } = require("../utils/automationEngine");

// ── CREATE MEETING ──────────────────────────────────────────────────────────
exports.createMeeting = async (req, res) => {
    try {
        const { startDate, endDate, assignedTo } = req.body;
        const userId = req.user.id;
        const companyId = req.user.companyId;

        // Conflict detection
        const overlap = await Meeting.findOne({
            assignedTo: assignedTo || userId,
            companyId,
            status: { $ne: "Closed" },
            $or: [
                { startDate: { $lt: new Date(endDate) }, endDate: { $gt: new Date(startDate) } }
            ]
        });

        if (overlap) {
            return res.status(400).json({ success: false, message: "Time slot already booked for this user." });
        }

        const data = await Meeting.create({
            ...req.body,
            companyId,
            branchId: req.user.branchId || null,
            createdBy: userId,
            assignedTo: assignedTo || userId
        });

        // Run Automation
        await runAutomation("meeting_scheduled", companyId, { record: data, userId });

        // Log activity
        await Activity.create({
            leadId: data.leadId || null,
            dealId: data.dealId || null,
            customerId: data.customerId || null,
            userId,
            companyId,
            type: "meeting",
            note: `Meeting scheduled: ${data.title || "Meeting"}`
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error("CREATE MEETING ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET MEETINGS ────────────────────────────────────────────────────────────
exports.getMeetings = async (req, res) => {
    try {
        const { start, end, search, leadId, customerId, dealId } = req.query;
        let query = { companyId: req.user.companyId };

        if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
        if (req.user.role === "sales") query.assignedTo = req.user.id;

        if (start && end) {
            query.startDate = { $gte: new Date(start), $lte: new Date(end) };
        }
        if (search) {
            query.title = { $regex: search, $options: "i" };
        }
        if (leadId) query.leadId = leadId;
        if (customerId) query.customerId = customerId;
        if (dealId) query.dealId = dealId;

        const data = await Meeting.find(query)
            .populate("leadId", "name email phone")
            .populate("assignedTo", "name role")
            .sort({ startDate: 1 });

        res.json({ success: true, data });
    } catch (error) {
        console.error("GET MEETINGS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET MEETING BY ID ───────────────────────────────────────────────────────
exports.getMeetingById = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

        const data = await Meeting.findOne(query)
            .populate("leadId", "name email phone")
            .populate("assignedTo", "name role")
            .populate("createdBy", "name");

        if (!data) return res.status(404).json({ success: false, message: "Meeting not found" });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── UPDATE MEETING ──────────────────────────────────────────────────────────
exports.updateMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const query = { _id: id, companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

        const current = await Meeting.findOne(query);
        if (!current) return res.status(404).json({ success: false, message: "Meeting not found" });

        // If time is being updated, check for conflicts
        if (req.body.startDate || req.body.endDate) {
            const start = req.body.startDate || current.startDate;
            const end = req.body.endDate || current.endDate;
            const assignedTo = req.body.assignedTo || current.assignedTo;

            const overlap = await Meeting.findOne({
                assignedTo,
                companyId: req.user.companyId,
                _id: { $ne: id },
                status: { $ne: "Closed" },
                $or: [
                    { startDate: { $lt: new Date(end) }, endDate: { $gt: new Date(start) } }
                ]
            });

            if (overlap) {
                return res.status(400).json({ success: false, message: "Time slot already booked for this user." });
            }
        }

        const updated = await Meeting.findOneAndUpdate(
            query,
            req.body,
            { new: true }
        );

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error("UPDATE MEETING ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── DELETE MEETING ──────────────────────────────────────────────────────────
exports.deleteMeeting = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

        const deleted = await Meeting.findOneAndDelete(query);
        if (!deleted) return res.status(404).json({ success: false, message: "Meeting not found" });

        res.json({ success: true, message: "Meeting deleted successfully" });
    } catch (error) {
        console.error("DELETE MEETING ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const Activity = require("../models/Activity");
const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const Call = require("../models/Call");
const Meeting = require("../models/Meeting");
const Todo = require("../models/Todo");
const Note = require("../models/Note");
const Message = require("../models/Message");
const Inquiry = require("../models/Inquiry");

// ── LOG NEW ACTIVITY ──────────────────────────────────────────────────────────
exports.createActivity = async (req, res) => {
    try {
        const { leadId, dealId, inquiryId, customerId, type, note, title, mentionedUserId, attachments } = req.body;

        if (!type || !note) {
            return res.status(400).json({ success: false, message: "Type and note are required." });
        }

        const activity = await Activity.create({
            leadId: leadId || null,
            dealId: dealId || null,
            inquiryId: inquiryId || null,
            customerId: customerId || null,
            userId: req.user.id,
            companyId: req.user.companyId,
            branchId: req.user.branchId || null, // Capture branch context
            type,
            note,
            title: title || null,
            mentionedUserId: mentionedUserId || null,
            attachments: attachments || []
        });

        // ── Team Collaboration: Trigger Notification for mentions ──
        if (mentionedUserId) {
            const Notification = require("../models/Notification");
            await Notification.create({
                userId: mentionedUserId,
                companyId: req.user.companyId,
                branchId: req.user.branchId || null,
                type: "info",
                title: "You were mentioned",
                message: `${req.user.name} mentioned you in a ${type} note for lead.`,
                metadata: { leadId, inquiryId, activityId: activity._id }
            });
        }

        const io = req.app.get("io");
        if (io && req.user?.companyId) {
            const broadcastData = {
                id: activity._id,
                leadId: activity.leadId,
                inquiryId: activity.inquiryId,
                type: activity.type,
                note: activity.note,
                userId: req.user.id,
                createdAt: activity.createdAt
            };
            io.to(`company:${req.user.companyId}`).emit("activity:created", broadcastData);
            if (mentionedUserId) {
                io.to(`user:${mentionedUserId}`).emit("notification:new", { 
                    message: `${req.user.name} tagged you in a note.`,
                    type: 'mention'
                });
            }
        }

        res.status(201).json({ success: true, data: activity });
    } catch (error) {
        console.error("CREATE ACTIVITY ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET ACTIVITIES BY LEAD ────────────────────────────────────────────────────
exports.getActivitiesByLead = async (req, res) => {
    try {
        const { getRBACFilter } = require("../utils/rbac");
        const query = getRBACFilter(req.user, { leadId: req.params.leadId });

        const activities = await Activity.find(query)
            .populate("userId", "name")
            .sort({ createdAt: -1 });

        res.json({ success: true, data: activities });
    } catch (error) {
        console.error("GET ACTIVITIES ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── UNIFIED TIMELINE (Existing + New Activities) ──────────────────────────────
exports.getActivityTimeline = async (req, res) => {
    try {
        const { leadId, inquiryId, customerId, dealId } = req.query;
        const { getRBACFilter } = require("../utils/rbac");
        let baseFilter = getRBACFilter(req.user);

        // If specific entity requested, filter all models by that entity
        let leadMatch = { ...baseFilter };
        let dealMatch = { ...baseFilter };
        let activityMatch = { ...baseFilter };

        if (leadId) {
            leadMatch._id = leadId;
            activityMatch.$or = [{ leadId: leadId }, { inquiryId: leadId }];
        }
        if (inquiryId) {
            // Strict isolation for a single inquiry timeline.
            const inquiry = await Inquiry.findById(inquiryId).select("_id leadId").lean();
            const inquiryLeadId = inquiry?.leadId ? String(inquiry.leadId) : null;
            activityMatch.$or = inquiryLeadId
                ? [{ inquiryId }, { leadId: inquiryLeadId }]
                : [{ inquiryId }];
            // Prevent broad fetch from non-target entities when inquiry is specified.
            leadMatch._id = inquiryLeadId || "__none__";
            dealMatch._id = "__none__";
        }
        if (customerId) {
            dealMatch.customerId = customerId;
            activityMatch.customerId = customerId;
        }
        if (dealId) {
            dealMatch._id = dealId;
            activityMatch.dealId = dealId;
        }

        const [leads, deals, calls, meetings, todos, notes, chatMessages, logActivities] = await Promise.all([
            Lead.find(leadMatch).sort({ createdAt: -1 }).limit(leadId ? 1 : 20),
            Deal.find(dealMatch).sort({ updatedAt: -1 }).limit(dealId ? 1 : 20),
            Call.find(activityMatch).sort({ createdAt: -1 }).limit(20),
            Meeting.find(activityMatch).sort({ createdAt: -1 }).limit(20),
            Todo.find(activityMatch).sort({ updatedAt: -1 }).limit(20),
            Note.find(activityMatch).sort({ createdAt: -1 }).limit(20),
            require("../models/Message").find(activityMatch).sort({ createdAt: -1 }).limit(20),
            Activity.find(activityMatch).populate("userId", "name").populate("mentionedUserId", "name").sort({ createdAt: -1 }).limit(100)
        ]);

        let timeline = [
            ...leads.map(l => ({ type: 'lead', title: `Lead: ${l.name}`, date: l.createdAt, id: l._id, leadId: l._id })),
            ...deals.map(d => ({ type: 'deal', title: `Deal: ${d.title} (${d.stage})`, date: d.updatedAt, id: d._id, dealId: d._id })),
            ...calls.map(c => ({ type: 'call', title: `Call ${c.status}: ${c.title}`, date: c.startDate || c.createdAt, id: c._id, leadId: c.leadId })),
            ...meetings.map(m => ({ type: 'meeting', title: `Meeting ${m.status}: ${m.title}`, date: m.startDate || m.createdAt, id: m._id, leadId: m.leadId })),
            ...todos.map(t => ({ type: 'task', title: `Task ${t.status}: ${t.title}`, date: t.updatedAt || t.createdAt, id: t._id, leadId: t.leadId })),
            ...notes.map(n => ({ type: 'note', title: `Note: ${n.title}`, date: n.createdAt, id: n._id, leadId: n.leadId })),
            ...chatMessages.map(msg => ({ type: 'message', title: `Chat Message`, date: msg.createdAt, id: msg._id, leadId: msg.leadId })),
            ...logActivities.map(a => ({
                type: a.type,
                title: a.title || a.note,
                note: a.note,
                date: a.createdAt || a.updatedAt,
                id: a._id,
                user: a.userId?.name,
                leadId: a.leadId,
                mentionedUser: a.mentionedUserId?.name,
                attachments: a.attachments || []
            }))
        ].filter(item => item.date); // Ensure valid dates

        const entityIds = [...new Set(
            timeline
                .map(item => item.leadId)
                .filter(Boolean)
                .map(id => String(id))
        )];
        if (entityIds.length > 0) {
            const entities = await Lead.find({ _id: { $in: entityIds } }).select("_id type").lean();
            const entityTypeById = new Map(entities.map(entity => [String(entity._id), entity.type || "LEAD"]));
            timeline = timeline.map(item => {
                if (!item.leadId) return item;
                const entityType = entityTypeById.get(String(item.leadId)) || "LEAD";
                return { ...item, entityType };
            });
        }

        // FILTER BY TYPE IF REQUESTED
        if (req.query.type) {
            timeline = timeline.filter(item => item.type === req.query.type);
        }

        timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ success: true, data: timeline.slice(0, 100) });
    } catch (error) {
        console.error("TIMELINE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

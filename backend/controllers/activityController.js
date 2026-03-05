const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const Call = require("../models/Call");
const Meeting = require("../models/Meeting");
const Todo = require("../models/Todo");
const Note = require("../models/Note");
const Message = require("../models/Message");

exports.getActivityTimeline = async (req, res) => {
    try {
        const { leadId, customerId, dealId } = req.query;
        let match = { companyId: req.user.companyId };

        // Contextual filters
        if (leadId) match.leadId = leadId;
        if (customerId) match.customerId = customerId;
        if (dealId) match.dealId = dealId;

        // Fetching data from all activity sources
        const [leads, deals, calls, meetings, todos, notes, messages] = await Promise.all([
            Lead.find(leadId ? { _id: leadId, ...match } : { _id: null }),
            Deal.find(dealId ? { _id: dealId, ...match } : (customerId ? { customerId, ...match } : { _id: null })),
            Call.find(match),
            Meeting.find(match),
            Todo.find(match),
            Note.find(match),
            Message.find(match)
        ]);

        // Standardize activities
        const timeline = [
            ...leads.map(l => ({ type: 'lead', title: `Lead Created: ${l.name}`, date: l.createdAt, id: l._id })),
            ...deals.map(d => ({ type: 'deal', title: `Deal ${d.stage}: ${d.title}`, date: d.updatedAt, id: d._id })),
            ...calls.map(c => ({ type: 'call', title: `Call ${c.status}: ${c.title}`, date: c.startDate, id: c._id })),
            ...meetings.map(m => ({ type: 'meeting', title: `Meeting ${m.status}: ${m.title}`, date: m.startDate, id: m._id })),
            ...todos.map(t => ({ type: 'task', title: `Task ${t.status}: ${t.title}`, date: t.updatedAt, id: t._id })),
            ...notes.map(n => ({ type: 'note', title: `Note Added: ${n.title}`, date: n.createdAt, id: n._id })),
            ...messages.map(msg => ({ type: 'message', title: `${msg.type.toUpperCase()} ${msg.status}: ${msg.content.substring(0, 30)}...`, date: msg.createdAt, id: msg._id, msgType: msg.type }))
        ];

        // Sort by date DESC
        timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(timeline.slice(0, 50)); // Limit to most recent 50
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

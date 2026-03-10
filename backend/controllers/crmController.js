const Customer = require("../models/Customer");
const Contact = require("../models/Contact");
const Call = require("../models/Call");
const Meeting = require("../models/Meeting");
const Todo = require("../models/Todo");
const Note = require("../models/Note");

const { runAutomation } = require("../utils/automationEngine");

// ============================
// CUSTOMER CONTROLLER
// ============================
exports.createCustomer = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

        const data = await Customer.create({
            ...req.body,
            companyId: req.user.companyId,
            branchId: req.user.branchId || null,
            createdBy: req.user.id
        });
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error("CREATE CUSTOMER ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCustomers = async (req, res) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        let query = { companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;
        if (search) query.name = { $regex: search, $options: "i" };

        const data = await Customer.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        // Parallel fetch for task counts
        const customersWithTaskCounts = await Promise.all(
            data.map(async (customer) => {
                const pendingTasksCount = await Todo.countDocuments({
                    customerId: customer._id,
                    status: { $in: ["Pending", "In Progress"] }
                });
                return { ...customer.toObject(), pendingTasksCount };
            })
        );

        const total = await Customer.countDocuments(query);
        res.json({ success: true, data: customersWithTaskCounts, total, pages: Math.ceil(total / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateCustomer = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

        const updated = await Customer.findOneAndUpdate(
            query,
            req.body,
            { new: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const query = { _id: id, companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

        await Customer.findOneAndDelete(query);
        await Contact.deleteMany({ customerId: id, companyId: req.user.companyId });
        res.json({ success: true, message: "Customer and its contacts deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCustomer360 = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const customer = await Customer.findOne({ _id: id, companyId });
        if (!customer) return res.status(404).json({ message: "Customer not found or access denied" });

        // Aggregate everything related to this customer
        const [contacts, deals, calls, meetings, todos, notes] = await Promise.all([
            Contact.find({ customerId: id, companyId }),
            require("../models/Deal").find({ customerId: id, companyId }).populate('assignedTo', 'name'),
            Call.find({ customerId: id, companyId }).sort({ createdAt: -1 }),
            Meeting.find({ customerId: id, companyId }).sort({ startDate: -1 }),
            Todo.find({ customerId: id, companyId }).sort({ dueDate: -1 }),
            Note.find({ customerId: id, companyId }).sort({ createdAt: -1 })
        ]);

        res.json({
            success: true,
            data: {
                customer,
                contacts,
                deals,
                activities: {
                    calls,
                    meetings,
                    todos,
                    notes
                },
                revenue: deals.filter(d => d.stage === 'Closed Won').reduce((sum, d) => sum + (d.value || 0), 0)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================
// CONTACT CONTROLLER
// ============================
exports.createContact = async (req, res) => {
    try {
        const data = await Contact.create({
            ...req.body,
            companyId: req.user.companyId,
            branchId: req.user.branchId || null,
            createdBy: req.user.id
        });
        res.json({ success: true, data });
    } catch (error) {
        console.error("CREATE CONTACT ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getContacts = async (req, res) => {
    try {
        const { search, customerId, page = 1, limit = 50 } = req.query;
        let query = { companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;
        if (customerId) query.customerId = customerId;
        if (search) query.name = { $regex: search, $options: "i" };
        const data = await Contact.find(query)
            .populate("customerId", "name")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        const total = await Contact.countDocuments(query);
        res.json({ success: true, data, total, pages: Math.ceil(total / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateContact = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

        const updated = await Contact.findOneAndUpdate(
            query,
            req.body,
            { new: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteContact = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

        await Contact.findOneAndDelete(query);
        res.json({ success: true, message: "Contact deleted successfully" });
    } catch (error) {
        console.error("DELETE CONTACT ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================
// CALL CONTROLLER
// ============================
exports.createCall = async (req, res) => {
    try {
        const data = await Call.create({
            ...req.body,
            companyId: req.user.companyId,
            branchId: req.user.branchId || null,
            createdBy: req.user.id,
            assignedTo: req.body.assignedTo || req.user.id
        });
        res.json({ success: true, data });
    } catch (error) {
        console.error("CREATE CALL ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCalls = async (req, res) => {
    try {
        let query = { companyId: req.user.companyId };
        if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
        if (req.user.role === "sales") query.assignedTo = req.user.id;
        const data = await Call.find(query).sort({ startDate: -1 });
        res.json({ success: true, data });
    } catch (error) {
        console.error("GET CALLS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateCall = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

        const updated = await Call.findOneAndUpdate(
            query,
            req.body,
            { new: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error("UPDATE CALL ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteCall = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

        const deleted = await Call.findOneAndDelete(query);
        if (!deleted) return res.status(404).json({ success: false, message: "Call not found" });
        res.json({ success: true, message: "Call deleted successfully" });
    } catch (error) {
        console.error("DELETE CALL ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================
// MEETING CONTROLLER
// ============================
exports.createMeeting = async (req, res) => {
    try {
        const data = await Meeting.create({
            ...req.body,
            companyId: req.user.companyId,
            branchId: req.user.branchId || null,
            createdBy: req.user.id,
            assignedTo: req.body.assignedTo || req.user.id
        });

        // Run Automation
        await runAutomation("meeting_scheduled", req.user.companyId, { record: data, userId: req.user.id });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getMeetings = async (req, res) => {
    try {
        let query = { companyId: req.user.companyId };
        if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
        if (req.user.role === "sales") query.assignedTo = req.user.id;
        const data = await Meeting.find(query).sort({ startDate: -1 });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateMeeting = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

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

// ============================
// TODO CONTROLLER
// ============================
exports.createTodo = async (req, res) => {
    try {
        const data = await Todo.create({
            ...req.body,
            companyId: req.user.companyId,
            branchId: req.user.branchId || null,
            createdBy: req.user.id,
            assignedTo: req.body.assignedTo || req.user.id
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getTodos = async (req, res) => {
    try {
        const { leadId, dealId, customerId } = req.query;
        let query = { companyId: req.user.companyId };

        if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
        if (req.user.role === "sales") query.assignedTo = req.user.id;

        if (leadId) query.leadId = leadId;
        if (dealId) query.dealId = dealId;
        if (customerId) query.customerId = customerId;

        const data = await Todo.find(query).sort({ dueDate: 1 });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateTodo = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

        const updated = await Todo.findOneAndUpdate(
            query,
            req.body,
            { new: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error("UPDATE TODO ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteTodo = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

        const deleted = await Todo.findOneAndDelete(query);
        if (!deleted) return res.status(404).json({ success: false, message: "Todo not found" });
        res.json({ success: true, message: "Todo deleted successfully" });
    } catch (error) {
        console.error("DELETE TODO ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================
// NOTE CONTROLLER
// ============================
exports.createNote = async (req, res) => {
    try {
        const data = await Note.create({
            ...req.body,
            companyId: req.user.companyId,
            branchId: req.user.branchId || null,
            createdBy: req.user.id
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getNotes = async (req, res) => {
    try {
        const { leadId, customerId, dealId, contactId } = req.query;
        let query = { companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

        if (leadId) query.leadId = leadId;
        if (customerId) query.customerId = customerId;
        if (dealId) query.dealId = dealId;
        if (contactId) query.contactId = contactId;

        const data = await Note.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.user.companyId };
        if (req.user.role === "branch_manager" || req.user.role === "sales") query.branchId = req.user.branchId;

        await Note.findOneAndDelete(query);
        res.json({ success: true, message: "Note deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

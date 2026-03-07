const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const Customer = require("../models/Customer");
const Contact = require("../models/Contact");
const { runAutomation } = require("../utils/automationEngine");
const { calculateLeadScore, assignLeadAutomatically } = require("../utils/leadManagement");

/* ================= CREATE LEAD ================= */
exports.createLead = async (req, res) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      companyId: req.user.companyId,
      branchId: req.user.branchId || req.body.branchId || null,
      createdBy: req.user.id,
      assignedTo: req.user.role === "sales" ? req.user.id : (req.body.assignedTo || null)
    });

    // Module 2: Automatic Lead Assignment if unassigned
    if (!lead.assignedTo) {
      await assignLeadAutomatically(lead._id, req.user.companyId, lead.branchId);
    }

    // Module 1: AI Lead Scoring
    await calculateLeadScore(lead._id);

    // Refresh lead data for response
    const finalizedLead = await Lead.findById(lead._id).populate("assignedTo", "name email");

    // Run Automations
    await runAutomation("lead_created", req.user.companyId, { record: finalizedLead, userId: req.user.id, ...finalizedLead.toObject() });

    res.json({
      message: "Lead Created & Managed via AI",
      lead: finalizedLead
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/* ================= GET LEADS ================= */
exports.getLeads = async (req, res) => {
  try {
    const { search, status } = req.query;
    let filter = {
      companyId: req.user.companyId,
      isDeleted: false
    };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (status) {
      filter.status = status;
    }

    // Role-based filtering
    if (req.user.role === "branch_manager") {
      filter.branchId = req.user.branchId;
    }

    if (req.user.role === "sales") {
      filter.assignedTo = req.user.id;
    }

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email");

    res.json(leads);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/* ================= UPDATE LEAD ================= */
exports.updateLead = async (req, res) => {
  try {
    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    // ✅ Never allow client to overwrite these protected fields
    const { companyId, branchId, createdBy, isDeleted, isConverted, ...safeBody } = req.body;

    const lead = await Lead.findOneAndUpdate(
      query,
      safeBody,
      { new: true }
    );

    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/* ================= DELETE LEAD (Soft Delete) ================= */
exports.deleteLead = async (req, res) => {
  try {

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    await Lead.findOneAndUpdate(query, {
      isDeleted: true
    });

    res.json({ message: "Lead Deleted Successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= CONVERT LEAD TO DEAL ================= */
exports.convertLead = async (req, res) => {
  try {

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    const lead = await Lead.findOne(query);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found in your access scope" });
    }

    if (lead.isConverted) {
      return res.status(400).json({ message: "Lead already converted" });
    }

    // 1. Create Customer (Account)
    const customer = await Customer.create({
      name: lead.companyName || lead.name + " Account",
      phone: lead.phone,
      email: lead.email,
      companyId: lead.companyId,
      branchId: lead.branchId,
      createdBy: req.user.id
    });

    // 2. Create Contact
    const contact = await Contact.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      customerId: customer._id,
      companyId: lead.companyId,
      branchId: lead.branchId,
      assignedTo: lead.assignedTo || req.user.id,
      createdBy: req.user.id
    });

    // 3. Create Deal from Lead
    const deal = await Deal.create({
      title: lead.name + " Opportunity",
      value: lead.value || 0,
      stage: "New",
      leadId: lead._id,
      customerId: customer._id,
      contactId: contact._id,
      companyId: lead.companyId,
      branchId: lead.branchId || null,
      assignedTo: lead.assignedTo || req.user.id,
      createdBy: req.user.id
    });

    // Update Lead
    lead.isConverted = true;
    lead.status = "Won"; // Signifies the lead part of lifecycle is Won
    await lead.save();

    // Trigger automation
    await runAutomation("deal_created", lead.companyId, { record: deal, userId: req.user.id });

    res.json({
      success: true,
      message: "Lead Converted to Customer & Deal Successfully",
      customer,
      contact,
      deal
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
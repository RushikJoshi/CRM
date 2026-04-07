const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const Customer = require("../models/Customer");
const Contact = require("../models/Contact");
const Todo = require("../models/Todo");
const FollowUp = require("../models/FollowUp");
const Pipeline = require("../models/Pipeline"); // DYNAMIC PIPELINE
const { runAutomation } = require("../utils/automationEngine");
const { calculateLeadScore, assignLeadAutomatically } = require("../utils/leadManagement");
const { logChange, createAuditEntry } = require("../utils/auditLogger");
const { annotateDuplicates, findDuplicateCandidates, mergePrimaryRecordData, normalizeEmail, normalizePhone, reassignLinkedDocuments } = require("../utils/duplicateUtils");
const Activity = require("../models/Activity");
const { getNextCustomId } = require("../utils/idGenerator");
const leadRoutingService = require("../services/leadRouting.service");


// LEGACY FALLBACK (only used when company has no pipeline configured)
const LEAD_PIPELINE_STAGES_FALLBACK = ["new", "qualified", "proposition", "won"];

// ── PIPELINE AUTO-HEALER ──────────────────────────────────────────────────────
const DEFAULT_STAGES = [
    { name: "New",         order: 1, color: "#0ea5e9", probability: 10 },
    { name: "Qualified",   order: 2, color: "#8b5cf6", probability: 30 },
    { name: "Proposal",    order: 3, color: "#f59e0b", probability: 60 },
    { name: "Won",         order: 4, color: "#10b981", probability: 100 }
];

async function getCompanyPipelineStages(companyId) {
    try {
        if (!companyId) {
            throw new Error("Pipeline initialization failed: Company ID is missing.");
        }

        // Atomic operation to find or create the pipeline to prevent race conditions
        let pipeline = await Pipeline.findOneAndUpdate(
            { companyId },
            { $setOnInsert: { name: "Main Pipeline", companyId, stages: DEFAULT_STAGES } },
            { new: true, upsert: true, lean: true }
        );

        if (!pipeline) {
            throw new Error("Critical: Pipeline could not be retrieved or created.");
        }

        const stages = Array.isArray(pipeline.stages) 
            ? [...pipeline.stages].sort((a, b) => (a.order || 0) - (b.order || 0))
            : [];

        return { stages, pipeline };
    } catch (err) {
        console.error("PIPELINE FETCH ERROR [CONV]:", err.message);
        throw err;
    }
}


/* ================= CREATE LEAD ================= */
exports.createLead = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    // STEP 11 — DUPLICATE LEAD DETECTION (Stability)
    let existingLead = await Lead.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.phone }],
      companyId: req.user.companyId,
      isDeleted: false
    });

    if (existingLead) {
      existingLead.notes = (existingLead.notes || "") + "\n\nDuplicate Creation Attempt: " + (req.body.notes || "No notes");
      await existingLead.save();
      console.log("Existing Lead updated instead of creating new:", existingLead._id);
      return res.json({ success: true, message: "Lead already exists, updated notes.", data: existingLead });
    }

    const cleanData = { ...req.body };
    cleanData.email = cleanData.email ? String(cleanData.email).trim().toLowerCase() : "";
    cleanData.phone = cleanData.phone ? String(cleanData.phone).trim() : "";
    cleanData.emailNormalized = normalizeEmail(cleanData.email);
    cleanData.phoneNormalized = normalizePhone(cleanData.phone);
    if (cleanData.sourceId === "") cleanData.sourceId = null;
    if (cleanData.assignedTo === "") cleanData.assignedTo = null;

    const now = new Date();
    const initialStage = normalizeLeadStage(cleanData.stage || "new_lead");
    const customId = await getNextCustomId({ companyId: req.user.companyId, module: "lead" });

    const lead = await Lead.create({
      ...cleanData,
      companyId: req.user.companyId,
      branchId: req.user.branchId || req.body.branchId || null,
      createdBy: req.user.id,
      assignedTo: req.user.role === "sales" ? req.user.id : (cleanData.assignedTo || null),
      stage: initialStage,
      stageUpdatedAt: now,
      stageHistory: [{ stage: initialStage, enteredAt: now, exitedAt: null }],
      customId
    });


    if (req.body.sourceId) {
      const LeadSource = require("../models/LeadSource");
      const sourceObj = await LeadSource.findById(req.body.sourceId);
      if (sourceObj) {
        lead.source = sourceObj.name;
        await lead.save();
      }
    }

    // Module 2: Automatic Lead Routing (Location Intel)
    if (!lead.assignedTo) {
      const routingResult = await leadRoutingService.routeLead(lead.cityId, req.user.companyId);
      if (routingResult.status === "assigned") {
        lead.assignedTo = routingResult.assignedTo;
        lead.assignedBranchId = routingResult.assignedBranchId;
        lead.assignedManagerId = routingResult.assignedManagerId;
        lead.assignedSalesIds = routingResult.assignedSalesIds;
        lead.branchId = routingResult.assignedBranchId || lead.branchId;
        await lead.save();
      }
    }

    // Module 1: AI Lead Scoring
    await calculateLeadScore(lead._id);

    // refresh lead data for response
    const finalizedLead = await Lead.findById(lead._id).populate("assignedTo", "name email");

    // LOG ACTIVITY
    await Activity.create({
      leadId: finalizedLead._id,
      userId: req.user.id,
      companyId: req.user.companyId,
      type: "lead",
      note: `New Lead Created: ${finalizedLead.name}`
    });

    // Run Automations
    await runAutomation("lead_created", req.user.companyId, { record: finalizedLead, userId: req.user.id, ...finalizedLead.toObject() });

    await createAuditEntry({
      userId: req.user.id,
      action: "create",
      objectType: "Lead",
      objectId: finalizedLead._id,
      companyId: req.user.companyId,
      branchId: finalizedLead.branchId || req.user.branchId || null,
      description: `Lead created: ${finalizedLead.name}`,
      req
    });

    // ── AUTO-FOLLOWUPS ───────────────────────────────────
    const createAutoFollowUps = async (leadId, companyId, userId) => {
        const plans = [
            { day: 1, type: "call", note: "Initial discovery call" },
            { day: 3, type: "whatsapp", note: "Value proposition message" },
            { day: 5, type: "email", note: "Follow-up email with brochure" }
        ];
        for (const p of plans) {
            const scheduledAt = new Date();
            scheduledAt.setDate(scheduledAt.getDate() + p.day);
            scheduledAt.setHours(10, 0, 0, 0); // Default to 10 AM

            const f = await FollowUp.create({
                leadId,
                companyId,
                createdBy: userId,
                type: p.type,
                scheduledAt,
                note: p.note,
                status: "pending"
            });

            await Activity.create({
                leadId,
                userId,
                companyId,
                type: "follow_up",
                note: `Auto-scheduled ${p.type.toUpperCase()} follow-up for Day ${p.day}`
            });
        }
    };
    createAutoFollowUps(finalizedLead._id, req.user.companyId, req.user.id);

    console.log("Lead created:", finalizedLead._id, "for company:", req.user.companyId);

    res.status(201).json({
      success: true,
      message: "Lead Created successfully",
      data: finalizedLead
    });

  } catch (error) {
    console.error("CREATE LEAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};




/* ================= GET LEADS ================= */
exports.getLeads = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { search, status, stage, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { $and: [{ isDeleted: false, type: { $ne: "INQUIRY" } }] };
    
    if (search) {
        filter.$and.push({ name: { $regex: search, $options: "i" } });
    }
    if (status) {
      if (status.includes(",")) {
        filter.$and.push({ status: { $in: status.split(",").map((s) => s.trim()) } });
      } else {
        filter.$and.push({ status });
      }
    }
    if (stage) {
      const stages = stage.split(",").map((s) => s.trim()).filter(Boolean);
      if (stages.length > 0) {
        filter.$and.push({ stage: stages.length === 1 ? stages[0] : { $in: stages } });
      }
    }

    if (req.user.role !== "super_admin") {
      filter.$and.push({ companyId: req.user.companyId });
      if (req.user.role === "branch_manager") {
         filter.$and.push({ 
           $or: [
             { branchId: req.user.branchId },
             { assignedBranchId: req.user.branchId },
             { assignedManagerId: req.user.id }
           ]
         });
      }
      if (req.user.role === "sales") {
        filter.$and.push({
            $or: [
                { assignedTo: req.user.id },
                { assignedSalesIds: req.user.id }
            ]
        });
      }
    }

    const finalFilter = filter.$and.length > 0 ? filter : {};

    const [total, leads] = await Promise.all([
      Lead.countDocuments(finalFilter),
      Lead.find(finalFilter)
        .populate("assignedTo", "name email role")
        .populate("createdBy", "name email")
        .populate("sourceId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    // ENHANCEMENT: Fetch pending tasks count for each lead in parallel
    const leadsWithTaskCounts = await Promise.all(
      leads.map(async (lead) => {
        try {
          const pendingTasksCount = await Todo.countDocuments({
            leadId: lead._id,
            companyId: req.user.companyId,
            status: { $in: ["Pending", "In Progress"] }
          }).catch(() => 0);
          return { ...lead.toObject(), pendingTasksCount };
        } catch (err) {
          console.error(`Task count error for lead ${lead._id}:`, err.message);
          return { ...lead.toObject(), pendingTasksCount: 0 };
        }
      })
    );

    const leadsWithDuplicateInfo = await annotateDuplicates(Lead, leadsWithTaskCounts, "LEAD");

    res.json({
      success: true,
      data: leadsWithDuplicateInfo,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });

  } catch (error) {
    console.error("GET LEADS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET LEAD BY ID ================= */
exports.getLeadById = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const query = { _id: req.params.id, isDeleted: false };
    if (req.user.role !== "super_admin") {
      query.companyId = req.user.companyId;
      if (req.user.role === "branch_manager") {
         query.$or = [
           { branchId: req.user.branchId },
           { assignedBranchId: req.user.branchId },
           { assignedManagerId: req.user.id }
         ];
      }
      if (req.user.role === "sales") {
          query.$or = [
              { assignedTo: req.user.id },
              { assignedSalesIds: req.user.id }
          ];
      }
    }
    const lead = await Lead.findOne(query)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .populate("branchId", "name")
      .populate("sourceId");
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
    if (lead.type === "INQUIRY") {
      return res.json({
        success: true,
        entityType: "INQUIRY",
        redirectTo: `/inquiries/${lead._id}`,
        data: lead
      });
    }
    res.json({ success: true, entityType: "LEAD", data: lead });
  } catch (error) {
    console.error("GET LEAD BY ID ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE LEAD ================= */
exports.updateLead = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") {
       query.$or = [
         { branchId: req.user.branchId },
         { assignedBranchId: req.user.branchId },
         { assignedManagerId: req.user.id }
       ];
    }
    if (req.user.role === "sales") {
       query.$or = [
         { assignedTo: req.user.id },
         { assignedSalesIds: req.user.id }
       ];
    }

    const { companyId, branchId, createdBy, isDeleted, isConverted, ...safeBody } = req.body;

    const previousLead = await Lead.findOne(query);
    if (!previousLead) return res.status(404).json({ success: false, message: "Lead not found" });

    const updateData = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(updateData, "email")) {
      updateData.email = updateData.email ? String(updateData.email).trim().toLowerCase() : "";
      updateData.emailNormalized = normalizeEmail(updateData.email);
    }
    if (Object.prototype.hasOwnProperty.call(updateData, "phone")) {
      updateData.phone = updateData.phone ? String(updateData.phone).trim() : "";
      updateData.phoneNormalized = normalizePhone(updateData.phone);
    }
    if (updateData.sourceId === "") updateData.sourceId = null;
    if (updateData.assignedTo === "") updateData.assignedTo = null;

    if (updateData.sourceId) {
      const LeadSource = require("../models/LeadSource");
      const sourceObj = await LeadSource.findById(updateData.sourceId);
      if (sourceObj) {
        updateData.source = sourceObj.name;
      }
    }

    const lead = await Lead.findOneAndUpdate(
      query,
      updateData,
      { new: true }
    );

    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    // Enterprise Audit Logging (timeline)
    await logChange({
      leadId: lead._id,
      userId: req.user.id,
      companyId: req.user.companyId,
      oldData: previousLead,
      newData: lead,
      fields: ["status", "assignedTo", "value", "phone", "email"]
    });

    await createAuditEntry({
      userId: req.user.id,
      action: "update",
      objectType: "Lead",
      objectId: lead._id,
      companyId: req.user.companyId,
      branchId: lead.branchId || null,
      changes: { previous: previousLead.toObject(), updated: lead.toObject() },
      description: `Lead updated: ${lead.name}`,
      req
    });

    // Re-calculate AI Score whenever lead info changes
    await calculateLeadScore(lead._id);

    // STEP 8 — CUSTOMER CREATION on "Won"
    const isNowWon = safeBody.status && safeBody.status.toLowerCase().includes("won");
    const wasAlreadyWon = previousLead.status.toLowerCase().includes("won");

    if (isNowWon && !wasAlreadyWon) {
      if (!lead.isConverted) {
        const Customer = require("../models/Customer");
        const Contact = require("../models/Contact");

        const customer = await Customer.create({
          name: lead.companyName || lead.name + " Account",
          phone: lead.phone,
          email: lead.email,
          companyId: lead.companyId,
          branchId: lead.branchId,
          createdBy: req.user.id
        });

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

        lead.isConverted = true;
        await lead.save();
      }
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    console.error("UPDATE LEAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= ASSIGN LEAD ================= */
exports.assignLead = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { assignedTo } = req.body;
    if (!assignedTo) return res.status(400).json({ success: false, message: "assignedTo is required" });

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    const previousLead = await Lead.findOne(query).lean();
    if (!previousLead) return res.status(404).json({ success: false, message: "Lead not found or access denied" });

    const lead = await Lead.findOneAndUpdate(
      query,
      { assignedTo },
      { new: true }
    ).populate("assignedTo", "name email");

    // Enterprise Audit Logging
    await logChange({
      leadId: lead._id,
      userId: req.user.id,
      companyId: req.user.companyId,
      oldData: previousLead,
      newData: lead,
      fields: ["assignedTo"]
    });

    const { createNotification } = require("../utils/notificationService");
    await createNotification({
      userId: assignedTo,
      companyId: lead.companyId,
      title: "New Lead Assigned",
      message: `You have been assigned a new lead: ${lead.name}`,
      type: "info"
    });

    // LOG ASSIGNMENT ACTIVITY
    await Activity.create({
      leadId: lead._id,
      userId: req.user.id,
      companyId: req.user.companyId,
      type: "system",
      note: `Lead assigned to ${lead.assignedTo?.name || "Unknown"}`
    });

    // Automation trigger: lead_assigned
    await runAutomation("lead_assigned", req.user.companyId, {
      record: lead,
      userId: req.user.id,
      previousAssignee: previousLead.assignedTo,
      newAssignee: assignedTo,
      ...lead.toObject()
    });

    res.json({ success: true, message: "Lead assigned successfully", data: lead });
  } catch (error) {
    console.error("ASSIGN LEAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= DELETE LEAD (Soft Delete) ================= */
exports.deleteLead = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    const lead = await Lead.findOneAndUpdate(query, { isDeleted: true });
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    await createAuditEntry({
      userId: req.user.id,
      action: "delete",
      objectType: "Lead",
      objectId: lead._id,
      companyId: req.user.companyId,
      branchId: lead.branchId || null,
      description: `Lead soft-deleted: ${lead.name}`,
      req
    });

    res.json({ success: true, message: "Lead Deleted Successfully" });

  } catch (error) {
    console.error("DELETE LEAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= CONVERT LEAD TO DEAL ================= */
exports.convertLead = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    const lead = await Lead.findOne(query);

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found in your access scope" });
    }

    if (lead.isConverted) {
      return res.status(400).json({ success: false, message: "Lead already converted" });
    }

    const customer = await Customer.create({
      name: lead.companyName || lead.name + " Account",
      phone: lead.phone,
      email: lead.email,
      companyId: lead.companyId,
      branchId: lead.branchId,
      createdBy: req.user.id
    });

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

    const dealCustomId = await getNextCustomId({ companyId: lead.companyId, module: "deal" });

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
      createdBy: req.user.id,
      customId: dealCustomId
    });


    lead.isConverted = true;
    lead.status = "Won";
    lead.stage = "won";
    lead.stageUpdatedAt = new Date();
    await lead.save();

    // LOG CONVERSION ACTIVITY (system + deal for timeline)
    await Activity.create({
      leadId: lead._id,
      userId: req.user.id,
      companyId: req.user.companyId,
      type: "system",
      note: "Lead converted",
    });
    await Activity.create({
      leadId: lead._id,
      dealId: deal._id,
      userId: req.user.id,
      companyId: req.user.companyId,
      type: "deal",
      note: `Converted to Deal: ${deal.title}`,
    });

    await runAutomation("deal_created", lead.companyId, { record: deal, userId: req.user.id });

    res.json({
      success: true,
      message: "Lead Converted to Customer & Deal Successfully",
      data: { customer, contact, deal }
    });

  } catch (error) {
    console.error("CONVERT LEAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};




function normalizeLeadStage(stage) {
  const s = (stage || "New").toString().trim();
  return s; // Return exactly what is passed (or New) — mapping is handled by Super Admin
}

/* ================= GET LEADS BY PIPELINE (RAW + STRUCTURE) ================= */
exports.getLeadsPipeline = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const companyId = req.user.companyId;

    let filter = { isDeleted: false, isLost: { $ne: true }, type: { $ne: "INQUIRY" } };
    if (req.user.role !== "super_admin") {
      filter.companyId = companyId;
      if (req.user.role === "branch_manager" && req.user.branchId) {
        filter.branchId = req.user.branchId;
      }
      if (req.user.role === "sales") {
        filter.$or = [
          { assignedTo: req.user.id },
          { assignedTo: null }
        ];
      }
    }

    // STEP 1: FETCH / CREATE PIPELINE (Autoritative)
    const { stages, pipeline } = await getCompanyPipelineStages(companyId);

    // STEP 2: FETCH RAW LEADS
    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email")
      .sort({ stageUpdatedAt: -1, createdAt: -1 })
      .lean();

    console.log("PIPELINE FETCHED:", pipeline._id);
    console.log("STAGES COUNT:", stages.length);
    console.log("RAW LEADS FETCHED:", leads.length);

    // Return the single source of truth: Pipeline (to build board) + Leads (to group dynamically)
    res.json({
      success: true,
      pipeline,
      leads // Raw array — frontend will do the grouping
    });
  } catch (error) {
    console.error("GET LEADS PIPELINE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= UPDATE LEAD STAGE (PATCH /api/leads/:id/stage) ================= */
exports.updateLeadStage = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { status: newStage } = req.body;
    if (!newStage) {
      return res.status(400).json({ success: false, message: "Stage is required." });
    }

    // VALIDATE AGAINST DYNAMIC PIPELINE STAGES
    const { stages: dynamicStages } = await getCompanyPipelineStages(req.user.companyId);
    const validStages = dynamicStages || [];
    
    // LEGACY MAPPING: Handle old stage names (new_lead, etc.)
    const LEGACY_MAP = {
      "new_lead": "New",
      "qualified_lead": "Qualified",
      "proposition": "Proposal",
      "new": "New",
      "won": "Won",
      "lost": "lost"
    };

    let mappedStage = newStage;
    if (LEGACY_MAP[newStage.toLowerCase()]) {
      mappedStage = LEGACY_MAP[newStage.toLowerCase()];
    }

    // CASE-INSENSITIVE MATCH
    const targetStageObj = validStages.find(s => 
      s.name?.toLowerCase() === mappedStage.toLowerCase() || 
      s.name?.toLowerCase() === newStage.toLowerCase()
    );

    if (!targetStageObj) {
      const validNames = validStages.map(s => s.name || "UNNAMED STAGE").join(", ");
      console.warn(`[400] Update Lead Stage: Invalid stage '${newStage}'. Valid options: ${validNames}`);
      return res.status(400).json({
        success: false,
        message: `Invalid stage: '${newStage}'. Available: ${validNames || "Empty Pipeline"}.`,
        debug: { newStage, mappedStage, validStageCount: validStages.length }
      });
    }

    // Always use the EXACT case from the database
    const exactStageName = targetStageObj.name;

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    const lead = await Lead.findOne(query);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    const oldStage = normalizeLeadStage(lead.stage);
    if (oldStage === exactStageName && lead.isLost !== true) {
      return res.json({ success: true, data: lead });
    }

    const now = new Date();
    let history = Array.isArray(lead.stageHistory) ? [...lead.stageHistory] : [];
    if (history.length > 0 && history[history.length - 1].exitedAt == null) {
      history[history.length - 1].exitedAt = now;
    } else if (history.length === 0 && oldStage) {
      const prevEntered = lead.stageUpdatedAt || lead.createdAt;
      if (prevEntered) history.push({ stage: oldStage, enteredAt: new Date(prevEntered), exitedAt: now });
    }
    history.push({ stage: exactStageName, enteredAt: now, exitedAt: null });
    lead.stageHistory = history;
    lead.stage = exactStageName;
    lead.stageUpdatedAt = now;

    // USE DYNAMIC PROBABILITY FROM PIPELINE
    if (typeof targetStageObj.probability === "number") {
      lead.probability = targetStageObj.probability;
    }

    if (exactStageName.toLowerCase() === "won") {
      lead.status = "Won";
      lead.wonAt = now;
      lead.isLost = false;
      lead.lostAt = null;
      lead.lostReason = "";
      lead.lostNotes = "";

      // CONVERSION LOGIC (Missing from this endpoint previously)
      if (!lead.isConverted) {
        const Customer = require("../models/Customer");
        const Contact = require("../models/Contact");

        const customer = await Customer.create({
          name: lead.companyName || lead.name + " Account",
          phone: lead.phone,
          email: lead.email,
          companyId: lead.companyId,
          branchId: lead.branchId,
          createdBy: req.user.id
        });

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

        lead.isConverted = true;
      }
    }

    await lead.save();

    await Activity.create({
      leadId: lead._id,
      userId: req.user.id,
      companyId: req.user.companyId,
      type: "lead_stage_changed",
      note: `Stage changed from ${formatStageLabel(oldStage)} → ${formatStageLabel(exactStageName)}`,
      previousStage: oldStage,
      newStage: exactStageName,
    });

    if (exactStageName.toLowerCase() === "won") {
      await Activity.create({
        leadId: lead._id,
        userId: req.user.id,
        companyId: req.user.companyId,
        type: "system",
        note: "Lead marked as Won",
      });
    }

    const updated = await Lead.findById(lead._id).populate("assignedTo", "name email").lean();
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("UPDATE LEAD STAGE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

function formatStageLabel(stage) {
  if (!stage) return "";
  const s = stage.toString().trim();
  const labels = {
    qualified: "Qualified",
    new: "New",
    proposition: "Proposition",
    won: "Won",
  };
  // If it's a known snake_case or legacy key, format it nicely.
  // Otherwise, return the dynamic stage name as is.
  if (labels[s.toLowerCase()]) return labels[s.toLowerCase()];
  return s.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}


/* ================= MARK LEAD AS LOST (POST /api/leads/:id/lost) ================= */
exports.markLeadLost = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { reason, notes } = req.body || {};

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    const lead = await Lead.findOne(query);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    const oldStage = normalizeLeadStage(lead.stage);

    lead.isLost = true;
    lead.lostAt = new Date();
    lead.lostReason = (reason || "").toString();
    lead.lostNotes = (notes || "").toString();
    lead.probability = 0;
    lead.status = "Lost";
    lead.stageUpdatedAt = new Date();
    await lead.save();

    await Activity.create({
      leadId: lead._id,
      userId: req.user.id,
      companyId: req.user.companyId,
      type: "lead_lost",
      note: `Lead marked as Lost from ${formatStageLabel(oldStage)}${lead.lostReason ? ` — Reason: ${lead.lostReason}` : ""}`,
      previousStage: oldStage,
      newStage: "lost",
    });

    const updated = await Lead.findById(lead._id).populate("assignedTo", "name email").lean();
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("MARK LEAD LOST ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET LOST LEADS (GET /api/leads/lost) ================= */
exports.getLostLeads = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    let filter = { isDeleted: false, isLost: true };
    if (req.user.role !== "super_admin") {
      filter.companyId = req.user.companyId;
      if (req.user.role === "branch_manager" && req.user.branchId) filter.branchId = req.user.branchId;
      if (req.user.role === "sales") filter.assignedTo = req.user.id;
    }

    const leads = await Lead.find(filter).populate("assignedTo", "name email").sort({ lostAt: -1, updatedAt: -1 }).lean();
    res.json({ success: true, data: leads });
  } catch (error) {
    console.error("GET LOST LEADS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= BULK UPDATE LEADS ================= */
exports.bulkUpdateLeads = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { ids, updateData, action } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No leads selected" });
    }

    const query = { _id: { $in: ids }, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    let dbUpdate = {};
    let note = "";

    if (action === "update_status") {
      dbUpdate = { status: updateData.status };
      note = `Bulk Status Update to ${updateData.status}`;
    } else if (action === "assign_user") {
      dbUpdate = { assignedTo: updateData.assignedTo };
      note = `Bulk Assigned to user: ${updateData.assignedToName || "New User"}`;
    } else if (action === "delete") {
      dbUpdate = { isDeleted: true };
      note = `Bulk Leads Deleted`;
    }

    const result = await Lead.updateMany(query, dbUpdate);

    // LOG BULK ACTIVITY
    const Activity = require("../models/Activity");
    await Activity.create({
      userId: req.user.id,
      companyId: req.user.companyId,
      type: "system",
      note: `${note} (${result.modifiedCount} leads updated)`
    });

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} leads.`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("BULK UPDATE LEAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= IMPORT LEADS (CSV) ================= */
exports.importLeads = async (req, res) => {
  const fs = require("fs");
  const csv = require("csv-parser");
  const path = require("path");

  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          const now = new Date();
          const leadsToCreate = results.map((row) => ({
            name: row.name || row.Name || row.full_name || "Imported Lead",
            email: row.email || row.Email || "",
            phone: row.phone || row.Phone || row.mobile || "",
            companyName: row.company || row.Company || "",
            value: parseFloat(row.value || row.Value || 0),
            status: row.status || row.Status || "New",
            stage: "new_lead",
            stageUpdatedAt: now,
            companyId: req.user.companyId,
            branchId: req.user.branchId || null,
            createdBy: req.user.id,
            assignedTo: req.user.role === "sales" ? req.user.id : null,
          })).filter(l => l.name);

          if (leadsToCreate.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ success: false, message: "No valid lead data found in CSV" });
          }

          const created = await Lead.insertMany(leadsToCreate);

          // Log Bulk Import Activity
          await Activity.create({
            userId: req.user.id,
            companyId: req.user.companyId,
            type: "system",
            note: `Imported ${created.length} leads via CSV`
          });

          // Cleanup file
          fs.unlinkSync(filePath);

          res.json({
            success: true,
            message: `Successfully imported ${created.length} leads.`,
            count: created.length
          });
        } catch (err) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          res.status(500).json({ success: false, message: "Error processing CSV data: " + err.message });
        }
      });
  } catch (error) {
    console.error("IMPORT LEADS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= LOG INTERACTION ================= */
exports.logInteraction = async (req, res) => {
  try {
    const { type, note, selectedMentions } = req.body;
    const leadId = req.params.id;

    if (!type || !note) {
      return res.status(400).json({ success: false, message: "Type and note are required" });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    // Normalize type to lowercase as per schema requirement
    const activityType = type.toLowerCase();

    const activity = await Activity.create({
      leadId,
      userId: req.user.id,
      companyId: req.user.companyId,
      branchId: lead.branchId,
      type: activityType,
      note,
      mentionedUserId: selectedMentions && selectedMentions.length > 0 ? selectedMentions[0] : null
    });

    // Update last interaction
    lead.updatedAt = new Date();
    await lead.save();

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error("LOG INTERACTION ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= CREATE TASK ================= */
exports.createTask = async (req, res) => {
    try {
        const leadId = req.params.id;
        const { title, description, priority, dueDate, assignedTo } = req.body;

        const lead = await Lead.findById(leadId);
        if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

        const task = await Todo.create({
            title,
            description,
            priority: priority || "Medium",
            dueDate,
            leadId,
            assignedTo: assignedTo || req.user.id,
            companyId: req.user.companyId,
            branchId: lead.branchId,
            createdBy: req.user.id
        });

        // Log activity
        await Activity.create({
            leadId,
            userId: req.user.id,
            companyId: req.user.companyId,
            branchId: lead.branchId,
            type: "task",
            note: `New task created: ${title}`
        });

        res.status(201).json({ success: true, data: task });
    } catch (error) {
        console.error("CREATE TASK ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ================= UPDATE FOLLOW UP ================= */
exports.updateFollowUp = async (req, res) => {
    try {
        const { id } = req.params; // leadId
        const { followUpId, status, note, extraInfo } = req.body;

        const followUp = await FollowUp.findById(followUpId);
        if (!followUp) return res.status(404).json({ success: false, message: "Follow-up not found" });

        followUp.status = status || followUp.status;
        followUp.note = note || followUp.note;
        
        // Handle extraInfo conversion (from summary fix)
        if (extraInfo) {
            let infoStr = "";
            try {
                // If it's a Mongoose map or similar, convert to entries
                const plainInfo = (typeof extraInfo.entries === "function") 
                    ? Object.fromEntries(extraInfo) 
                    : extraInfo;
                infoStr = JSON.stringify(plainInfo);
            } catch (e) {
                infoStr = String(extraInfo);
            }
            followUp.note = (followUp.note || "") + "\n\nUpdate Info: " + infoStr;
        }

        await followUp.save();

        // Log activity
        await Activity.create({
            leadId: followUp.leadId,
            userId: req.user.id,
            companyId: req.user.companyId,
            type: "follow_up",
            note: `Follow-up ${status}: ${note || ''}`
        });

        res.json({ success: true, data: followUp });
    } catch (error) {
        console.error("UPDATE FOLLOW UP ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ================= UPDATE TAGS ================= */
exports.updateTags = async (req, res) => {
    try {
        const leadId = req.params.id;
        const { tags } = req.body;

        const lead = await Lead.findById(leadId);
        if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

        // Update tags (flexible handling since field might not be in schema)
        lead.set('tags', tags);
        await lead.save();

        res.json({ success: true, message: "Tags updated successfully" });
    } catch (error) {
        console.error("UPDATE TAGS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLeadDuplicates = async (req, res) => {
  try {
    const baseQuery = { _id: req.params.id, companyId: req.user.companyId, type: "LEAD", isDeleted: false };
    if (req.user.role === "branch_manager") {
      baseQuery.$or = [
        { branchId: req.user.branchId },
        { assignedBranchId: req.user.branchId },
        { assignedManagerId: req.user.id }
      ];
    }
    if (req.user.role === "sales") {
      baseQuery.$or = [
        { assignedTo: req.user.id },
        { assignedSalesIds: req.user.id }
      ];
    }

    const lead = await Lead.findOne(baseQuery).lean();
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    const duplicates = await findDuplicateCandidates(Lead, {
      companyId: req.user.companyId,
      type: "LEAD",
      email: lead.email,
      phone: lead.phone,
      excludeId: lead._id,
    });

    res.json({ success: true, data: duplicates });
  } catch (error) {
    console.error("GET LEAD DUPLICATES ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.mergeLead = async (req, res) => {
  try {
    const sourceQuery = { _id: req.params.id, companyId: req.user.companyId, type: "LEAD", isDeleted: false };
    if (req.user.role === "branch_manager") {
      sourceQuery.$or = [
        { branchId: req.user.branchId },
        { assignedBranchId: req.user.branchId },
        { assignedManagerId: req.user.id }
      ];
    }
    if (req.user.role === "sales") {
      sourceQuery.$or = [
        { assignedTo: req.user.id },
        { assignedSalesIds: req.user.id }
      ];
    }

    const source = await Lead.findOne(sourceQuery);
    if (!source) return res.status(404).json({ success: false, message: "Lead not found" });

    let target = null;
    if (req.body?.targetId) {
      target = await Lead.findOne({
        _id: req.body.targetId,
        companyId: req.user.companyId,
        type: "LEAD",
        isDeleted: false,
      });
    } else {
      const duplicates = await findDuplicateCandidates(Lead, {
        companyId: req.user.companyId,
        type: "LEAD",
        email: source.email,
        phone: source.phone,
        excludeId: source._id,
      });
      if (duplicates.length) {
        target = await Lead.findById(duplicates[0]._id);
      }
    }

    if (!target) {
      return res.status(400).json({ success: false, message: "No duplicate lead found to merge into." });
    }

    mergePrimaryRecordData(target, source);
    source.isDeleted = true;
    source.notes = mergeTextForDeletion(source.notes, target._id);

    await Promise.all([
      target.save(),
      source.save(),
      reassignLinkedDocuments({ sourceId: source._id, targetId: target._id, type: "LEAD" }),
      Activity.create({
        leadId: target._id,
        userId: req.user.id,
        companyId: req.user.companyId,
        branchId: target.branchId || null,
        type: "system",
        note: `Merged duplicate lead ${source.name || source._id} into ${target.name || target._id}`,
        metadata: { mergedFromId: source._id, mergedIntoId: target._id }
      })
    ]);

    const mergedLead = await Lead.findById(target._id).populate("assignedTo", "name email role").lean();
    res.json({ success: true, message: "Lead merged successfully.", data: mergedLead });
  } catch (error) {
    console.error("MERGE LEAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

function mergeTextForDeletion(existingNotes, targetId) {
  const base = String(existingNotes || "").trim();
  const suffix = `Merged into record ${targetId}`;
  return base ? `${base}\n\n${suffix}` : suffix;
}

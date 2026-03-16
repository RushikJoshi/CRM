const Deal = require("../models/Deal");
const { runAutomation } = require("../utils/automationEngine");
const { logChange, createAuditEntry } = require("../utils/auditLogger");

/* ================= CREATE DEAL ================= */
exports.createDeal = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const deal = await Deal.create({
      ...req.body,
      companyId: req.user.companyId,
      branchId: req.user.branchId || null,
      createdBy: req.user.id
    });

    // If stageId is provided, sync the legacy stage string for system compatibility
    if (req.body.stageId) {
      const Stage = require("../models/Stage");
      const stageObj = await Stage.findById(req.body.stageId);
      if (stageObj) {
        deal.stage = stageObj.name;
        await deal.save();
      }
    }

    await runAutomation("deal_created", req.user.companyId, { record: deal, userId: req.user.id, ...deal.toObject() });

    await createAuditEntry({
      userId: req.user.id,
      action: "create",
      objectType: "Deal",
      objectId: deal._id,
      companyId: req.user.companyId,
      branchId: deal.branchId || null,
      description: `Deal created: ${deal.title}`,
      req
    });

    console.log("Deal created:", deal._id, "for company:", req.user.companyId);

    res.status(201).json({ success: true, message: "Deal Created successfully", data: deal });

  } catch (error) {
    console.error("CREATE DEAL ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= GET DEALS ================= */
exports.getDeals = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { stage, pipelineId, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (stage) {
      filter.stage = stage;
    }

    if (pipelineId) {
      filter.pipelineId = pipelineId;
    }

    if (req.user.role !== "super_admin") {
      filter.companyId = req.user.companyId;
      if (req.user.role === "branch_manager") {
        filter.branchId = req.user.branchId;
      }
      if (req.user.role === "sales") {
        filter.assignedTo = req.user.id;
      }
    }

    const [total, deals] = await Promise.all([
      Deal.countDocuments(filter),
      Deal.find(filter)
        .populate("assignedTo", "name email")
        .populate("leadId", "name email phone companyName source priority")
        .populate("customerId", "name")
        .populate("stageId")
        .populate("pipelineId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    res.json({
      success: true,
      data: deals,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });

  } catch (error) {
    console.error("GET DEALS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= UPDATE DEAL STAGE ================= */
exports.updateStage = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    const previousDeal = await Deal.findOne(query).lean();
    if (!previousDeal) return res.status(404).json({ success: false, message: "Deal not found" });

    const updateData = { ...req.body };
    let newStageName = req.body.stage || null;

    // Legacy support: if stageId is passed, find the name and update the 'stage' string
    if (req.body.stageId) {
      const Stage = require("../models/Stage");
      const stageObj = await Stage.findById(req.body.stageId);
      if (stageObj) {
        updateData.stage = stageObj.name;
        newStageName = stageObj.name;
      }
    }

    const deal = await Deal.findOneAndUpdate(
      query,
      updateData,
      { new: true }
    );

    // Enterprise Audit Logging (timeline)
    await logChange({
      dealId: deal._id,
      userId: req.user.id,
      companyId: req.user.companyId,
      oldData: previousDeal,
      newData: deal,
      fields: ["stage", "assignedTo", "value", "title"]
    });

    await createAuditEntry({
      userId: req.user.id,
      action: "update",
      objectType: "Deal",
      objectId: deal._id,
      companyId: req.user.companyId,
      branchId: deal.branchId || null,
      changes: { previousStage: previousDeal.stage, newStage: newStageName || deal.stage },
      description: `Deal stage updated: ${deal.title}`,
      req
    });

    if (!deal) return res.status(404).json({ success: false, message: "Deal not found" });

    // Create activity for stage change
    try {
      const Activity = require("../models/Activity");
      const previousStageName = previousDeal.stage || null;
      const finalNewStageName = newStageName || deal.stage;

      await Activity.create({
        dealId: deal._id,
        userId: req.user.id,
        companyId: req.user.companyId,
        type: "deal_stage_changed",
        note: `Deal stage changed from '${previousStageName || "Unknown"}' to '${finalNewStageName || "Unknown"}'.`,
        previousStage: previousStageName,
        newStage: finalNewStageName
      });
    } catch (activityError) {
      console.error("CREATE DEAL STAGE ACTIVITY ERROR:", activityError);
    }

    // Notification trigger: Deal Won
    const stageNameForNotification = (newStageName || deal.stage || "").toLowerCase();
    if (stageNameForNotification === "won" || stageNameForNotification === "closed won") {
      const { createNotification } = require("../utils/notificationService");
      await createNotification({
        userId: deal.assignedTo || deal.createdBy,
        companyId: deal.companyId,
        title: "Deal Won!",
        message: `Congratulations! Deal '${deal.title}' was won!`,
        type: "success"
      });
    }

    const previousStageName = previousDeal.stage || null;
    await runAutomation("deal_stage_changed", req.user.companyId, {
      record: deal,
      userId: req.user.id,
      previousStage: previousStageName,
      newStage: newStageName || deal.stage,
      ...deal.toObject()
    });

    res.json({ success: true, message: "Stage Updated successfully", data: deal });

  } catch (error) {
    console.error("UPDATE DEAL STAGE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE DEAL (Full) ================= */
exports.updateDeal = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;

    const { companyId, branchId, createdBy, ...safeBody } = req.body;

    const deal = await Deal.findOneAndUpdate(
      query,
      safeBody,
      { new: true }
    );
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found" });

    await createAuditEntry({
      userId: req.user.id,
      action: "update",
      objectType: "Deal",
      objectId: deal._id,
      companyId: req.user.companyId,
      branchId: deal.branchId || null,
      description: `Deal updated: ${deal.title}`,
      req
    });

    res.json({ success: true, data: deal });
  } catch (error) {
    console.error("UPDATE DEAL ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE DEAL ================= */
exports.deleteDeal = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    const deal = await Deal.findOneAndDelete(query);
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found" });

    await createAuditEntry({
      userId: req.user.id,
      action: "delete",
      objectType: "Deal",
      objectId: deal._id,
      companyId: deal.companyId,
      branchId: deal.branchId || null,
      description: `Deal deleted: ${deal.title}`,
      req
    });

    res.json({ success: true, message: "Deal deleted Successfully" });
  } catch (error) {
    console.error("DELETE DEAL ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
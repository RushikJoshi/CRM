const Deal = require("../models/Deal");
const { runAutomation } = require("../utils/automationEngine");

/* ================= CREATE DEAL ================= */
exports.createDeal = async (req, res) => {
  try {

    const deal = await Deal.create({
      ...req.body,
      companyId: req.user.companyId,
      branchId: req.user.branchId || null,
      createdBy: req.user.id
    });

    // Run Automations
    await runAutomation("deal_created", req.user.companyId, { record: deal, userId: req.user.id, ...deal.toObject() });

    res.json({ message: "Deal Created", deal });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/* ================= GET DEALS ================= */
exports.getDeals = async (req, res) => {
  try {
    const { stage } = req.query;
    let filter = {
      companyId: req.user.companyId
    };

    if (stage) {
      filter.stage = stage;
    }

    if (req.user.role === "branch_manager") {
      filter.branchId = req.user.branchId;
    }

    if (req.user.role === "sales") {
      filter.assignedTo = req.user.id;
    }

    const deals = await Deal.find(filter)
      .populate("assignedTo", "name email")
      .populate("leadId", "name email phone");

    res.json(deals);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/* ================= UPDATE DEAL STAGE ================= */
exports.updateStage = async (req, res) => {
  try {

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;

    const deal = await Deal.findOneAndUpdate(
      query,
      { stage: req.body.stage },
      { new: true }
    );

    // Run Automations for stage change
    if (deal) {
      await runAutomation("deal_stage_changed", req.user.companyId, { record: deal, userId: req.user.id, stage: req.body.stage, ...deal.toObject() });
    }

    res.json({ message: "Stage Updated", deal });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= UPDATE DEAL (Full) ================= */
exports.updateDeal = async (req, res) => {
  try {
    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;

    const deal = await Deal.findOneAndUpdate(
      query,
      req.body,
      { new: true }
    );
    if (!deal) return res.status(404).json({ message: "Deal not found" });
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= DELETE DEAL ================= */
exports.deleteDeal = async (req, res) => {
  try {
    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;

    const deal = await Deal.findOneAndDelete(query);
    if (!deal) return res.status(404).json({ message: "Deal not found" });
    res.json({ message: "Deal deleted Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
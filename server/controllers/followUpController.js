const FollowUp = require("../models/FollowUp");
const Activity = require("../models/Activity");
const Lead = require("../models/Lead");

// Create Follow-up
exports.createFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params; // leadId
    const { type, scheduledAt, note } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found." });

    const followUp = await FollowUp.create({
      leadId: id,
      type,
      scheduledAt,
      note,
      companyId: req.user.companyId,
      createdBy: req.user._id,
      assignedTo: lead.assignedTo || req.user._id
    });

    // Log Activity
    await Activity.create({
      leadId: id,
      userId: req.user._id,
      companyId: req.user.companyId,
      type: "follow_up",
      note: `Follow-up scheduled (${type}) for ${new Date(scheduledAt).toLocaleString()}: ${note || 'No additional notes'}`
    });

    res.status(201).json({ success: true, data: followUp });
  } catch (error) { next(error); }
};

// Get Follow-ups for Lead
exports.getFollowUps = async (req, res, next) => {
  try {
    const followUps = await FollowUp.find({ leadId: req.params.id }).sort({ scheduledAt: -1 });
    res.json({ success: true, data: followUps });
  } catch (error) { next(error); }
};

// Update Status
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const followUp = await FollowUp.findById(id);
    if (!followUp) return res.status(404).json({ success: false, message: "Record not found." });

    followUp.status = status;
    await followUp.save();

    // Log Activity
    await Activity.create({
      leadId: followUp.leadId,
      userId: req.user._id,
      companyId: req.user.companyId,
      type: "follow_up",
      note: `Follow-up marked as ${status.toUpperCase()}: ${followUp.note || ''}`
    });

    res.json({ success: true, data: followUp });
  } catch (error) { next(error); }
};

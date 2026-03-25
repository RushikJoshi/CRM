const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    value: {
      type: Number,
      default: 0
    },

    stage: { // Legacy Support
      type: String,
      default: "New"
    },

    pipelineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pipeline"
    },

    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stage"
    },

    lostReason: {
      type: String,
      default: null
    },

    expectedCloseDate: {
      type: Date
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer"
    },

    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact"
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead"
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },



    customId: { type: String, unique: true },

  },
  { timestamps: true }
);

dealSchema.index({ customId: 1 });


dealSchema.index({ companyId: 1 });
dealSchema.index({ companyId: 1, updatedAt: -1 });
dealSchema.index({ companyId: 1, stage: 1 });
dealSchema.index({ pipelineId: 1, stageId: 1 });
dealSchema.index({ assignedTo: 1 });
dealSchema.index({ leadId: 1 });
dealSchema.index({ customerId: 1 });

module.exports = mongoose.model("Deal", dealSchema);
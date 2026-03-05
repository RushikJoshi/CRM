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

    stage: {
      type: String,
      default: "New"
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
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Deal", dealSchema);
const mongoose = require("mongoose");

const emailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "General",
    },
    previewText: {
      type: String,
      default: "",
    },
    body: {
      type: String,
      required: true,
    },
    design: {
      type: String,
      default: "RICH_TEXT",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

emailTemplateSchema.index({ companyId: 1 });

module.exports = mongoose.model("EmailTemplate", emailTemplateSchema);

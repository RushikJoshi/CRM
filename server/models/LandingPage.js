const mongoose = require("mongoose");

const landingPageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    description: { type: String },
    bannerImage: { type: String },
    slug: { type: String, required: true, unique: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

landingPageSchema.index({ companyId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model("LandingPage", landingPageSchema);

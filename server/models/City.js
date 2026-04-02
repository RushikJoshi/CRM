const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Performance: Index name for fast searching and unique matching
citySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
citySchema.index({ state: 1 });

module.exports = mongoose.model("City", citySchema);

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["super_admin", "company_admin", "branch_manager", "sales"],
      default: "sales"
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      // required: true
      default: null
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    lastAssignedAt: {
      type: Date,
      default: Date.now
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
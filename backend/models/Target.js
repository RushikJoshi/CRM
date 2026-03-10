const mongoose = require("mongoose");

const targetSchema = new mongoose.Schema(
    {
        // Who set this target (Branch Manager)
        setBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        // Who the target is for (Sales Rep)
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        },
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true
        },
        // Target period
        month: {
            type: Number, // 1–12
            required: true
        },
        year: {
            type: Number, // e.g., 2026
            required: true
        },
        // Revenue target (in INR)
        revenueTarget: {
            type: Number,
            default: 0
        },
        // Lead conversion target (number of leads to convert)
        leadsTarget: {
            type: Number,
            default: 0
        },
        // Deal closure target (number of deals to close)
        dealsTarget: {
            type: Number,
            default: 0
        },
        // Calls target (number of calls to make per month)
        callsTarget: {
            type: Number,
            default: 0
        },
        // Meetings target
        meetingsTarget: {
            type: Number,
            default: 0
        },
        notes: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

// Unique constraint: One target per user per month per year per branch
targetSchema.index({ assignedTo: 1, month: 1, year: 1, branchId: 1 }, { unique: true });
targetSchema.index({ branchId: 1, year: 1, month: 1 });
targetSchema.index({ companyId: 1 });

module.exports = mongoose.model("Target", targetSchema);

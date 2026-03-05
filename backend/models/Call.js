const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: { type: String },
        status: {
            type: String,
            enum: ["Scheduled", "In Progress", "Closed"],
            default: "Scheduled"
        },
        startDate: { type: Date },
        contactId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contact"
        },
        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lead"
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer"
        },
        dealId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Deal"
        },
        reminder: { type: Boolean, default: false },
        outcome: { type: String },
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
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Call", callSchema);

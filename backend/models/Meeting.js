const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: { type: String },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ["Scheduled", "In Progress", "Closed"],
            default: "Scheduled"
        },
        reminder: { type: Boolean, default: false },
        outcome: { type: String },
        location: { type: String },
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

module.exports = mongoose.model("Meeting", meetingSchema);

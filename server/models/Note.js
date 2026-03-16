const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        content: { type: String },
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
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        },
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);

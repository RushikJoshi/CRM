const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: { type: String },
        phone: { type: String },
        designation: { type: String },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer"
        },
        department: { type: String },
        buyingRole: { type: String },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
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
        }
    },
    { timestamps: true }
);

contactSchema.index({ companyId: 1 });
contactSchema.index({ customerId: 1 });
contactSchema.index({ email: 1, companyId: 1 });

module.exports = mongoose.model("Contact", contactSchema);

const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: { type: String },
        phone: { type: String },
        website: { type: String },
        industry: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MasterData"
        },
        billingAddress: {
            street: String,
            city: String,
            state: String,
            zip: String
        },
        shippingAddress: {
            street: String,
            city: String,
            state: String,
            zip: String
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

customerSchema.index({ companyId: 1 });
customerSchema.index({ companyId: 1, updatedAt: -1 });
customerSchema.index({ email: 1, companyId: 1 });

module.exports = mongoose.model("Customer", customerSchema);

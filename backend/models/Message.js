const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch"
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
    type: {
        type: String,
        enum: ["whatsapp", "sms"],
        required: true
    },
    recipientNumber: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["sent", "delivered", "failed", "logged"],
        default: "logged"
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

module.exports = mongoose.model("Message", MessageSchema);

const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: { type: String },
        meetingType: {
            type: String,
            enum: ["Consultation", "Follow-up", "Demo", "Interview", "Support", "Other"],
            default: "Consultation"
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        channel: {
            type: String,
            enum: ["online", "phone", "in_person", "offline", "hybrid"],
            default: "online"
        },
        attendanceMode: {
            type: String,
            enum: ["online", "offline", "phone", "hybrid", "in_person"],
            default: "online"
        },
        onlineUrl: {
            type: String,
            default: ""
        },
        meetingLink: {
            type: String,
            default: ""
        },
        sendEmailReminder: {
            type: Boolean,
            default: false
        },
        sendSmsReminder: {
            type: Boolean,
            default: false
        },
        sendSystemReminder: {
            type: Boolean,
            default: true
        },
        reminderMinutes: {
            type: [Number],
            default: [30]
        },
        reminders: {
            type: [{
                channel: {
                    type: String,
                    enum: ["system", "email"]
                },
                minutesBefore: {
                    type: Number,
                    default: 30
                },
                isSent: {
                    type: Boolean,
                    default: false
                },
                sentAt: {
                    type: Date,
                    default: null
                }
            }],
            default: []
        },
        status: {
            type: String,
            enum: ["Scheduled", "Confirmed", "In Progress", "Completed", "Cancelled", "Missed", "Closed"],
            default: "Scheduled"
        },
        reminder: { type: Boolean, default: false },
        outcome: { type: String },
        location: { type: String },
        notes: { type: String, default: "" },
        contactName: { type: String, default: "" },
        contactEmail: { type: String, default: "" },
        contactPhone: { type: String, default: "" },
        shareMessage: { type: String, default: "" },
        lastReminderSentAt: { type: Date, default: null },
        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lead"
        },
        inquiryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inquiry",
            default: null
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

meetingSchema.index({ companyId: 1, startDate: 1 });
meetingSchema.index({ assignedTo: 1, startDate: 1 });
meetingSchema.index({ leadId: 1, startDate: -1 });
meetingSchema.index({ inquiryId: 1, startDate: -1 });

module.exports = mongoose.model("Meeting", meetingSchema);

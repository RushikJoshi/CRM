const nodemailer = require("nodemailer");
const axios = require("axios");
const CampaignLog = require("../models/CampaignLog");
const Inquiry = require("../models/Inquiry");
const Activity = require("../models/Activity");
const MessageTracking = require("../models/MessageTracking");
const { updateLeadEngagement, POINTS } = require("../utils/engagementTracker");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

exports.processCampaignRecipient = async (campaign, recipientId) => {
    try {
        const lead = await Inquiry.findById(recipientId);
        if (!lead || lead.isDeleted) throw new Error("Recipient not found or deleted.");

        const channel = campaign.channel;
        const msg = campaign.message
            .replace(/\{\{name\}\}/g, lead.name || "")
            .replace(/\{\{email\}\}/g, lead.email || "")
            .replace(/\{\{phone\}\}/g, lead.phone || "");

        if (channel === "EMAIL") {
            const recipientEmail = lead.email;
            if (!recipientEmail) throw new Error("Email address missing.");

            // Send via Nodemailer
            await transporter.sendMail({
                from: process.env.SMTP_FROM || `"CRM Broadcast" <${process.env.SMTP_USER}>`,
                to: recipientEmail,
                subject: campaign.name,
                html: msg,
            });

            // Update Log
            await CampaignLog.findOneAndUpdate(
                { campaignId: campaign._id, leadId: recipientId },
                { status: "SENT", sentAt: new Date(), recipient: recipientEmail }
            );

            // Activity Log
            await Activity.create({
                inquiryId: lead._id,
                companyId: campaign.companyId,
                branchId: campaign.branchId,
                userId: campaign.createdBy,
                type: "campaign_message",
                title: "Campaign Email Sent",
                note: `Email sent via campaign: ${campaign.name}`
            });

        } else if (channel === "WHATSAPP") {
            const recipientPhone = lead.phone;
            if (!recipientPhone) throw new Error("Phone number missing.");

            // Meta Cloud API Logic
            const token = process.env.WHATSAPP_ACCESS_TOKEN;
            const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

            if (token && phoneId) {
                // If the user wants custom message, Meta usually requires 'text' type or template.
                // Assuming session is open or using free-form text if allowed.
                // For production, this usually needs a template if no reply in 24h.
                await axios.post(
                    `https://graph.facebook.com/v18.0/${phoneId}/messages`,
                    {
                        messaging_product: "whatsapp",
                        to: recipientPhone.replace(/\D/g, ""),
                        type: "text",
                        text: { body: msg }
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                console.warn("WhatsApp credentials missing, skipping actual send.");
            }

            // Update Log
            await CampaignLog.findOneAndUpdate(
                { campaignId: campaign._id, leadId: recipientId },
                { status: "SENT", sentAt: new Date(), recipient: recipientPhone }
            );

            // Chat History / Message Tracking
            await MessageTracking.create({
              leadId: lead._id,
              type: "whatsapp",
              status: "sent",
              source: "campaign",
              campaignId: campaign._id
            });

            await Activity.create({
              inquiryId: lead._id,
              companyId: campaign.companyId,
              branchId: campaign.branchId,
              userId: campaign.createdBy,
              type: "campaign_message",
              title: "Campaign WhatsApp Sent",
              note: `WhatsApp sent via campaign: ${campaign.name}`
            });
        }

        // Points
        await updateLeadEngagement(lead._id, POINTS.SENT);
        return { success: true };
    } catch (err) {
        console.error(`Error processing recipient ${recipientId} for campaign ${campaign._id}:`, err.message);
        await CampaignLog.findOneAndUpdate(
            { campaignId: campaign._id, leadId: recipientId },
            { status: "FAILED", error: err.message }
        );
        return { success: false, error: err.message };
    }
};

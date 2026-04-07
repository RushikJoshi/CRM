const nodemailer = require("nodemailer");
const axios = require("axios");
const CampaignLog = require("../models/CampaignLog");
const Inquiry = require("../models/Inquiry");
const Activity = require("../models/Activity");
const MessageTracking = require("../models/MessageTracking");
const EmailLog = require("../models/EmailLog");
const EmailSenderProfile = require("../models/EmailSenderProfile");
const { updateLeadEngagement, POINTS } = require("../utils/engagementTracker");
const { getTrackingBaseUrl } = require("../utils/trackingUrl");

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
        let lead = null;
        let recipientAddress = "";
        let recipientName = "";
        let campaignLog = null;

        if (campaign.recipientMode === "MANUAL") {
            recipientAddress = String(recipientId).trim().toLowerCase();
            recipientName = "Manual Recipient";
            campaignLog = await CampaignLog.findOne({ campaignId: campaign._id, recipient: recipientAddress });
            if (!recipientAddress) throw new Error("Manual recipient email is missing.");
        } else {
            lead = await Inquiry.findById(recipientId);
            if (!lead || lead.isDeleted) throw new Error("Recipient not found or deleted.");
            campaignLog = await CampaignLog.findOne({ campaignId: campaign._id, leadId: recipientId });
            recipientName = lead.name || "";
        }

        const channel = campaign.channel;
        const msg = campaign.message
            .replace(/\{\{name\}\}/g, lead?.name || recipientName || "")
            .replace(/\{\{email\}\}/g, lead?.email || recipientAddress || "")
            .replace(/\{\{phone\}\}/g, lead?.phone || "")
            .replace(/\{\{company\}\}/g, lead?.companyName || "")
            .replace(/\{\{course\}\}/g, lead?.courseSelected || "");

        if (channel === "EMAIL") {
            const recipientEmail = campaign.recipientMode === "MANUAL" ? recipientAddress : lead.email;
            if (!recipientEmail) throw new Error("Email address missing.");

            const senderProfile = campaign.senderProfileId
                ? await EmailSenderProfile.findById(campaign.senderProfileId)
                : null;
            const activeTransporter = nodemailer.createTransport({
                host: senderProfile?.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com",
                port: parseInt(senderProfile?.smtpPort, 10) || parseInt(process.env.SMTP_PORT, 10) || 587,
                secure: senderProfile?.smtpSecure === true || process.env.SMTP_SECURE === "true",
                auth: {
                    user: senderProfile?.smtpUser || process.env.SMTP_USER,
                    pass: senderProfile?.smtpPass || process.env.SMTP_PASS,
                },
            });

            const emailLog = await EmailLog.create({
                leadId: lead?._id || null,
                userId: campaign.createdBy,
                companyId: campaign.companyId,
                templateId: campaign.templateId || null,
                campaignId: campaign._id,
                campaignLogId: campaignLog?._id || null,
                subject: campaign.subject || campaign.name,
                body: msg,
                toAddress: recipientEmail,
                fromAddress: campaign.senderEmail || senderProfile?.fromEmail || process.env.SMTP_USER || "",
            });

            const trackingBase = getTrackingBaseUrl();
            let trackedHtml = msg;
            if (trackingBase) {
                const openUrl = `${trackingBase}/email/track/open/${emailLog._id}`;
                const clickBase = `${trackingBase}/email/track/click/${emailLog._id}?url=`;
                trackedHtml = msg.replace(/href=(["'])(.*?)\1/g, (_match, quote, url) => {
                    return `href=${quote}${clickBase}${encodeURIComponent(url)}${quote}`;
                });
                trackedHtml += `<img src="${openUrl}" width="1" height="1" style="display:none;" />`;
            }

            // Send via Nodemailer
            await activeTransporter.sendMail({
                from: campaign.senderEmail
                    ? `"${campaign.senderName || "CRM Broadcast"}" <${campaign.senderEmail}>`
                    : (senderProfile?.fromEmail
                        ? `"${senderProfile.fromName || campaign.senderName || "CRM Broadcast"}" <${senderProfile.fromEmail}>`
                        : process.env.SMTP_FROM || `"CRM Broadcast" <${process.env.SMTP_USER}>`),
                to: recipientEmail,
                subject: campaign.subject || campaign.name,
                html: trackedHtml,
            });

            // Update Log
            await CampaignLog.findByIdAndUpdate(campaignLog?._id, {
                status: "SENT",
                sentAt: new Date(),
                recipient: recipientEmail,
                recipientName: recipientName || recipientEmail,
                emailLogId: emailLog._id,
                error: "",
            });

            // Activity Log
            if (lead?._id) {
                await Activity.create({
                    inquiryId: lead._id,
                    companyId: campaign.companyId,
                    branchId: campaign.branchId,
                    userId: campaign.createdBy,
                    type: "campaign_message",
                    title: "Campaign Email Sent",
                    note: `Email sent via campaign: ${campaign.name}`
                });
            }

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
            await CampaignLog.findByIdAndUpdate(campaignLog?._id, {
                status: "SENT",
                sentAt: new Date(),
                recipient: recipientPhone,
                recipientName: recipientName || recipientPhone,
                error: "",
            });

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
        if (lead?._id) await updateLeadEngagement(lead._id, POINTS.SENT);
        return { success: true };
    } catch (err) {
        console.error(`Error processing recipient ${recipientId} for campaign ${campaign._id}:`, err.message);
        const logQuery = campaign.recipientMode === "MANUAL"
            ? { campaignId: campaign._id, recipient: String(recipientId).trim().toLowerCase() }
            : { campaignId: campaign._id, leadId: recipientId };
        await CampaignLog.findOneAndUpdate(logQuery, { status: "FAILED", error: err.message });
        return { success: false, error: err.message };
    }
};

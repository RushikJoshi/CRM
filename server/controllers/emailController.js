const EmailTemplate = require("../models/EmailTemplate");
const EmailLog = require("../models/EmailLog");
const Lead = require("../models/Inquiry"); // Unified model
const Activity = require("../models/Activity");
const nodemailer = require("nodemailer");
const MessageTracking = require("../models/MessageTracking");
const EmailSenderProfile = require("../models/EmailSenderProfile");
const CampaignLog = require("../models/CampaignLog");
const { updateLeadEngagement, POINTS } = require("../utils/engagementTracker");
const { getTrackingBaseUrl } = require("../utils/trackingUrl");

// SMTP Transporter setup assuming these env vars exist or will be added.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getTransportFromProfile = (profile) => {
  if (!profile) return transporter;
  return nodemailer.createTransport({
    host: profile.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(profile.smtpPort, 10) || parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: profile.smtpSecure === true,
    auth: {
      user: profile.smtpUser || process.env.SMTP_USER,
      pass: profile.smtpPass || process.env.SMTP_PASS,
    },
  });
};

const getFromAddress = (profile, fallbackEmail) => {
  const fromName = profile?.fromName || "CRM Notification";
  const fromEmail = profile?.fromEmail || fallbackEmail || process.env.SMTP_USER || "";
  return `"${fromName}" <${fromEmail}>`;
};

exports.getTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find({
      companyId: req.user.companyId,
      isDeleted: false,
    }).sort({ createdAt: -1 });
    res.status(200).json({ status: "success", data: templates });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getSenderProfiles = async (req, res) => {
  try {
    const profiles = await EmailSenderProfile.find({
      companyId: req.user.companyId,
      isDeleted: false,
    }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ status: "success", data: profiles });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.createSenderProfile = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      companyId: req.user.companyId,
      createdBy: req.user.id,
    };
    if (payload.isDefault) {
      await EmailSenderProfile.updateMany(
        { companyId: req.user.companyId, isDeleted: false },
        { isDefault: false }
      );
    }
    const profile = await EmailSenderProfile.create(payload);
    res.status(201).json({ status: "success", data: profile });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.updateSenderProfile = async (req, res) => {
  try {
    if (req.body.isDefault) {
      await EmailSenderProfile.updateMany(
        { companyId: req.user.companyId, isDeleted: false },
        { isDefault: false }
      );
    }
    const profile = await EmailSenderProfile.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId, isDeleted: false },
      req.body,
      { new: true }
    );
    res.status(200).json({ status: "success", data: profile });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.deleteSenderProfile = async (req, res) => {
  try {
    await EmailSenderProfile.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { isDeleted: true, isDefault: false }
    );
    res.status(200).json({ status: "success", message: "Sender profile deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.create({
      ...req.body,
      companyId: req.user.companyId,
      createdBy: req.user.id,
    });
    res.status(201).json({ status: "success", data: template });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      req.body,
      { new: true }
    );
    res.status(200).json({ status: "success", data: template });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    await EmailTemplate.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { isDeleted: true }
    );
    res.status(200).json({ status: "success", message: "Template deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.sendEmail = async (req, res) => {
  const { leadId, templateId, subject, body, to, from, senderProfileId } = req.body;
  if (!leadId) return res.status(400).json({ success: false, message: "leadId is required" });
  if (!subject || !body) return res.status(400).json({ success: false, message: "subject and body are required" });
  try {
    const lead = await Lead.findOne({ _id: leadId, isDeleted: false });
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    const recipientEmail = to || lead.email;
    if (!recipientEmail) return res.status(400).json({ success: false, message: "Recipient email is required" });

    console.log("SENDING EMAIL TO:", recipientEmail);
    console.log("SMTP USER:", process.env.SMTP_USER);

    const senderProfile = senderProfileId
      ? await EmailSenderProfile.findOne({ _id: senderProfileId, companyId: req.user.companyId, isDeleted: false })
      : null;
    const activeTransporter = getTransportFromProfile(senderProfile);

    let finalSubject = subject;
    let finalBody = body;

    // Replace variables
    const variables = {
      "{{name}}": lead.name || "",
      "{{email}}": lead.email || "",
      "{{company}}": lead.companyName || "",
      "{{phone}}": lead.phone || "",
    };

    Object.keys(variables).forEach((key) => {
      finalSubject = finalSubject.split(key).join(variables[key]);
      finalBody = finalBody.split(key).join(variables[key]);
    });

    // Save Email Log (initially)
    const emailLog = await EmailLog.create({
      leadId: lead._id,
      userId: req.user.id,
      companyId: req.user.companyId,
      templateId: templateId || null,
      subject: finalSubject,
      body: finalBody,
      toAddress: recipientEmail,
      fromAddress: senderProfile?.fromEmail || from || process.env.SMTP_FROM || process.env.SMTP_USER || "",
    });

    // Tracking pixel (New Engagement System)
    const trackingBase = getTrackingBaseUrl();
    if (trackingBase) {
      const engagementTrackingUrl = `${trackingBase}/email/track/open/${emailLog._id}`;
      const clickBase = `${trackingBase}/email/track/click/${emailLog._id}?url=`;
      finalBody = finalBody.replace(/href=(["'])(.*?)\1/g, (_match, quote, url) => {
        return `href=${quote}${clickBase}${encodeURIComponent(url)}${quote}`;
      });
      finalBody += `<img src="${engagementTrackingUrl}" width="1" height="1" style="display:none;" />`;
    }

    // Create MessageTracking entry
    await MessageTracking.create({
      leadId: lead._id,
      type: "email",
      status: "sent",
      messageId: emailLog._id.toString()
    });

    // Initial engagement points for sending
    await updateLeadEngagement(lead._id, POINTS.SENT);

    // Update log with final body
    emailLog.body = finalBody;
    await emailLog.save();

    // Send via Nodemailer
    await activeTransporter.sendMail({
      from: from || getFromAddress(senderProfile, process.env.SMTP_FROM || process.env.SMTP_USER),
      to: recipientEmail,
      subject: finalSubject,
      html: finalBody,
    });

    // Update lastContacted
    await Lead.findByIdAndUpdate(lead._id, { lastContacted: new Date() });

    // Log Activity with branchId
    await Activity.create({
      inquiryId: lead._id,
      userId: req.user.id,
      companyId: req.user.companyId,
      branchId: lead.branchId || null,
      type: "email",
      note: `Email sent to ${recipientEmail}: "${finalSubject}"`,
      title: "Email Sent",
    });

    res.status(200).json({ success: true, message: "Email sent successfully", data: { emailLogId: emailLog._id } });
  } catch (err) {
    console.error("EMAIL SEND ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.trackOpen = async (req, res) => {
  const { logId } = req.params;
  try {
    const log = await EmailLog.findById(logId);
    if (log && !log.isOpened) {
      log.isOpened = true;
      log.openedAt = new Date();
      log.openedCount += 1;
      log.status = "opened";
      await log.save();

      if (log.campaignLogId) {
        await CampaignLog.findByIdAndUpdate(log.campaignLogId, {
          status: "OPENED",
          openedAt: log.openedAt,
          $inc: { openedCount: 1 },
          emailLogId: log._id,
        });
      }

      // Lead Scoring (+10)
      if (log.leadId) await Lead.findByIdAndUpdate(log.leadId, { $inc: { score: 10 } });

      // Activity for tracking
      if (log.leadId) {
        await Activity.create({
          leadId: log.leadId,
          userId: log.userId, // Attributing to the sender
          companyId: log.companyId,
          type: "system",
          title: "Email Opened",
          note: `The recipient opened the email: ${log.subject}`,
        });
      }
    } else if (log) {
      log.openedCount += 1;
      await log.save();
      if (log.campaignLogId) {
        await CampaignLog.findByIdAndUpdate(log.campaignLogId, {
          $inc: { openedCount: 1 },
          emailLogId: log._id,
        });
      }
    }
  } catch (err) {
    console.error("TRACKING ERROR:", err);
  }

  // Return 1x1 base64 transparent gif
  const img = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );
  res.writeHead(200, {
    "Content-Type": "image/gif",
    "Content-Length": img.length,
  });
  res.end(img);
};

exports.trackClick = async (req, res) => {
  const { logId } = req.params;
  const { url } = req.query;
  try {
    const log = await EmailLog.findById(logId);
    if (log) {
      if (!log.isClicked) {
        log.isClicked = true;
        log.clickedAt = new Date();
        log.clickedCount += 1;
        log.status = "clicked";
        await log.save();

        if (log.campaignLogId) {
          await CampaignLog.findByIdAndUpdate(log.campaignLogId, {
            status: "CLICKED",
            clickedAt: log.clickedAt,
            $inc: { clickedCount: 1 },
            emailLogId: log._id,
          });
        }

        // Lead Scoring (+20)
        if (log.leadId) await Lead.findByIdAndUpdate(log.leadId, { $inc: { score: 20 } });

        // Activity for tracking
        if (log.leadId) {
          await Activity.create({
            leadId: log.leadId,
            userId: log.userId,
            companyId: log.companyId,
            type: "system",
            title: "Link Clicked",
            note: `Recipient clicked a link in the email: ${url}`,
          });
        }
      } else {
        log.clickedCount += 1;
        await log.save();
        if (log.campaignLogId) {
          await CampaignLog.findByIdAndUpdate(log.campaignLogId, {
            $inc: { clickedCount: 1 },
            emailLogId: log._id,
          });
        }
      }
    }
  } catch (err) {
    console.error("CLICK TRACK ERROR:", err);
  }

  // Redirect to original URL
  if (url) {
    res.redirect(url);
  } else {
    res.status(404).send("Link not found");
  }
};

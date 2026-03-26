const EmailTemplate = require("../models/EmailTemplate");
const EmailLog = require("../models/EmailLog");
const Lead = require("../models/Lead");
const Activity = require("../models/Activity");
const nodemailer = require("nodemailer");
const MessageTracking = require("../models/MessageTracking");
const { updateLeadEngagement, POINTS } = require("../utils/engagementTracker");

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
  const { leadId, templateId, subject, body, to, from } = req.body;
  try {
    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ status: "error", message: "Lead not found" });

    const recipientEmail = to || lead.email;
    if (!recipientEmail) return res.status(400).json({ status: "error", message: "Recipient email is required" });

    console.log("SENDING EMAIL TO:", recipientEmail);
    console.log("SMTP USER:", process.env.SMTP_USER);

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
    });

    // Tracking pixel (New Engagement System)
    const engagementTrackingUrl = `${process.env.API_BASE_URL || process.env.BASE_URL + "/api"}/track/email/${emailLog._id}`;
    const engagementPixelHtml = `<img src="${engagementTrackingUrl}" width="1" height="1" style="display:none;" />`;
    finalBody += engagementPixelHtml;

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
    await transporter.sendMail({
      from: from || process.env.SMTP_FROM || `"CRM Notification" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: finalSubject,
      html: finalBody,
    });

    // Log Activity
    await Activity.create({
      leadId: lead._id,
      userId: req.user.id,
      companyId: req.user.companyId,
      type: "email",
      note: `Sent Email to ${recipientEmail}: ${finalSubject}`,
      title: "Email Sent",
    });

    res.status(200).json({ status: "success", message: "Email sent successfully" });
  } catch (err) {
    console.error("🔴 EMAIL SEND ERROR:", err.message);
    res.status(500).json({ status: "error", message: err.message });
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
      await log.save();

      // Lead Scoring (+10)
      await Lead.findByIdAndUpdate(log.leadId, { $inc: { score: 10 } });

      // Activity for tracking
      await Activity.create({
        leadId: log.leadId,
        userId: log.userId, // Attributing to the sender
        companyId: log.companyId,
        type: "system",
        title: "Email Opened",
        note: `The recipient opened the email: ${log.subject}`,
      });
    } else if (log) {
      log.openedCount += 1;
      await log.save();
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
        await log.save();

        // Lead Scoring (+20)
        await Lead.findByIdAndUpdate(log.leadId, { $inc: { score: 20 } });

        // Activity for tracking
        await Activity.create({
          leadId: log.leadId,
          userId: log.userId,
          companyId: log.companyId,
          type: "system",
          title: "Link Clicked",
          note: `Recipient clicked a link in the email: ${url}`,
        });
      } else {
        log.clickedCount += 1;
        await log.save();
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

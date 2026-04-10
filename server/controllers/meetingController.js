const Meeting = require("../models/Meeting");
const Activity = require("../models/Activity");
const Inquiry = require("../models/Inquiry");
const User = require("../models/User");
const { runAutomation } = require("../utils/automationEngine");
const { createNotification } = require("../utils/notificationService");

const ACTIVE_STATUSES = ["Scheduled", "Confirmed", "In Progress"];
const DEFAULT_REMINDER_MINUTES = [30];

const normalizeDate = (value) => (value ? new Date(value) : null);
const normalizeObjectIdInput = (value) => {
  if (value === null || value === undefined) return undefined;
  const raw = String(value).trim();
  return raw ? raw : undefined;
};

const buildReminderPlan = (payload = {}, currentMeeting = null) => {
  const minuteValues = Array.isArray(payload.reminderMinutes) && payload.reminderMinutes.length
    ? payload.reminderMinutes
    : (currentMeeting?.reminderMinutes?.length ? currentMeeting.reminderMinutes : DEFAULT_REMINDER_MINUTES);

  const normalizedMinutes = [...new Set(
    minuteValues
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value >= 0)
  )].sort((a, b) => a - b);

  const channels = [];
  if (payload.sendSystemReminder !== false && currentMeeting?.sendSystemReminder !== false) channels.push("system");
  if (payload.sendSystemReminder === true) channels.push("system");
  if (payload.sendEmailReminder === true || (payload.sendEmailReminder === undefined && currentMeeting?.sendEmailReminder)) channels.push("email");

  const uniqueChannels = [...new Set(channels.length ? channels : ["system"])];
  const existingReminderMap = new Map(
    (currentMeeting?.reminders || []).map((reminder) => [`${reminder.channel}:${reminder.minutesBefore}`, reminder])
  );

  return {
    reminderMinutes: normalizedMinutes,
    reminders: normalizedMinutes.flatMap((minutesBefore) =>
      uniqueChannels.map((channel) => {
        const existing = existingReminderMap.get(`${channel}:${minutesBefore}`);
        return {
          channel,
          minutesBefore,
          isSent: existing?.isSent || false,
          sentAt: existing?.sentAt || null,
        };
      })
    ),
  };
};

const buildShareMessage = (meeting) => {
  const lines = [
    `Meeting: ${meeting.title}`,
    `Type: ${meeting.meetingType || "Consultation"}`,
    `When: ${new Date(meeting.startDate).toLocaleString("en-IN")}`,
    `Mode: ${meeting.attendanceMode || meeting.channel || "online"}`,
  ];

  if (meeting.attendanceMode === "online" || meeting.attendanceMode === "hybrid" || meeting.channel === "online") {
    if (meeting.meetingLink || meeting.onlineUrl) {
      lines.push(`Link: ${meeting.meetingLink || meeting.onlineUrl}`);
    }
  } else if (meeting.location) {
    lines.push(`Location: ${meeting.location}`);
  }

  if (meeting.description) {
    lines.push(`Details: ${meeting.description}`);
  }

  return lines.join("\n");
};

const hydrateContactFromLead = async (payload) => {
  const targetId = payload.leadId || payload.inquiryId;
  if (!targetId) return payload;

  const lead = await Inquiry.findById(targetId).select("name email phone type");
  if (!lead) return payload;

  return {
    ...payload,
    leadId: payload.leadId || (lead.type === "LEAD" ? lead._id : payload.leadId || lead._id),
    inquiryId: payload.inquiryId || (lead.type === "INQUIRY" ? lead._id : payload.inquiryId || null),
    contactName: payload.contactName || lead.name || "",
    contactEmail: payload.contactEmail || lead.email || "",
    contactPhone: payload.contactPhone || lead.phone || "",
  };
};

const validateAndNormalizePayload = async (req, currentMeeting = null) => {
  const payload = await hydrateContactFromLead({ ...req.body });
  const startDate = normalizeDate(payload.startDate || currentMeeting?.startDate);
  const endDate = normalizeDate(payload.endDate || currentMeeting?.endDate);

  if (!payload.title && !currentMeeting?.title) {
    throw new Error("Meeting title is required.");
  }
  if (!startDate || !endDate) {
    throw new Error("Meeting start and end times are required.");
  }
  if (endDate <= startDate) {
    throw new Error("Meeting end time must be after the start time.");
  }

  const attendanceMode = payload.attendanceMode || payload.channel || currentMeeting?.attendanceMode || currentMeeting?.channel || "online";
  const reminderPlan = buildReminderPlan(payload, currentMeeting);

  const normalized = {
    ...payload,
    startDate,
    endDate,
    attendanceMode,
    channel: attendanceMode,
    meetingLink: payload.meetingLink || payload.onlineUrl || currentMeeting?.meetingLink || currentMeeting?.onlineUrl || "",
    onlineUrl: payload.onlineUrl || payload.meetingLink || currentMeeting?.onlineUrl || currentMeeting?.meetingLink || "",
    reminderMinutes: reminderPlan.reminderMinutes,
    reminders: reminderPlan.reminders,
    reminder: reminderPlan.reminders.length > 0,
    sendSystemReminder: payload.sendSystemReminder !== undefined ? payload.sendSystemReminder : (currentMeeting?.sendSystemReminder ?? true),
    sendEmailReminder: payload.sendEmailReminder !== undefined ? payload.sendEmailReminder : (currentMeeting?.sendEmailReminder ?? false),
    contactName: payload.contactName || currentMeeting?.contactName || "",
    contactEmail: payload.contactEmail || currentMeeting?.contactEmail || "",
    contactPhone: payload.contactPhone || currentMeeting?.contactPhone || "",
    notes: payload.notes || currentMeeting?.notes || "",
    meetingType: payload.meetingType || currentMeeting?.meetingType || "Consultation",
    status: payload.status || currentMeeting?.status || "Scheduled",
    assignedTo: normalizeObjectIdInput(payload.assignedTo) || currentMeeting?.assignedTo || undefined,
    leadId: normalizeObjectIdInput(payload.leadId) || currentMeeting?.leadId || undefined,
    inquiryId: normalizeObjectIdInput(payload.inquiryId) || currentMeeting?.inquiryId || undefined,
    customerId: normalizeObjectIdInput(payload.customerId) || currentMeeting?.customerId || undefined,
    dealId: normalizeObjectIdInput(payload.dealId) || currentMeeting?.dealId || undefined,
  };

  normalized.shareMessage = buildShareMessage(normalized);
  return normalized;
};

const checkConflict = async ({ companyId, meetingId = null, assignedTo, startDate, endDate }) => {
  return Meeting.findOne({
    assignedTo,
    companyId,
    _id: meetingId ? { $ne: meetingId } : { $exists: true },
    status: { $in: ACTIVE_STATUSES },
    startDate: { $lt: new Date(endDate) },
    endDate: { $gt: new Date(startDate) },
  });
};

exports.createMeeting = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const companyId = req.user.companyId;
    const payload = await validateAndNormalizePayload(req);
    const assignedTo = payload.assignedTo || userId;

    const overlap = await checkConflict({
      companyId,
      assignedTo,
      startDate: payload.startDate,
      endDate: payload.endDate,
    });

    if (overlap) {
      return res.status(400).json({ success: false, message: "Time slot already booked for this user." });
    }

    const data = await Meeting.create({
      ...payload,
      companyId,
      branchId: req.user.branchId || null,
      createdBy: userId,
      assignedTo,
    });

    await runAutomation("meeting_scheduled", companyId, { record: data, userId });

    await Activity.create({
      leadId: data.leadId || null,
      inquiryId: data.inquiryId || data.leadId || null,
      dealId: data.dealId || null,
      customerId: data.customerId || null,
      userId,
      companyId,
      branchId: req.user.branchId || null,
      type: "meeting",
      title: "Meeting Scheduled",
      note: `Meeting scheduled: ${data.title} (${data.attendanceMode})`,
      metadata: {
        meetingId: data._id,
        startDate: data.startDate,
        meetingType: data.meetingType,
      }
    });

    await createNotification({
      userId: assignedTo,
      companyId,
      branchId: req.user.branchId || null,
      title: "Meeting Scheduled",
      message: `${data.title} is scheduled for ${new Date(data.startDate).toLocaleString("en-IN")}.`,
      type: "reminder",
      req,
    });

    const populated = await Meeting.findById(data._id)
      .populate("leadId", "name email phone")
      .populate("inquiryId", "name email phone")
      .populate("assignedTo", "name email role");

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error("CREATE MEETING ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const {
      start,
      end,
      search,
      leadId,
      customerId,
      dealId,
      status,
      attendanceMode,
      assignedTo,
      page = 1,
      limit = 50,
      upcoming,
    } = req.query;

    const query = { companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id || req.user._id;

    if (start && end) {
      query.startDate = { $gte: new Date(start), $lte: new Date(end) };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { contactName: { $regex: search, $options: "i" } },
        { contactEmail: { $regex: search, $options: "i" } },
      ];
    }
    if (leadId) query.leadId = leadId;
    if (customerId) query.customerId = customerId;
    if (dealId) query.dealId = dealId;
    if (status && status !== "ALL") query.status = status;
    if (attendanceMode && attendanceMode !== "ALL") query.attendanceMode = attendanceMode;
    if (assignedTo && assignedTo !== "ALL" && req.user.role !== "sales") query.assignedTo = assignedTo;
    if (upcoming === "true") query.endDate = { $gte: new Date() };

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 50, 1);
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Meeting.find(query)
        .populate("leadId", "name email phone")
        .populate("inquiryId", "name email phone")
        .populate("assignedTo", "name email role")
        .populate("createdBy", "name email")
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limitNum),
      Meeting.countDocuments(query),
    ]);

    res.json({
      success: true,
      data,
      total,
      page: pageNum,
      totalPages: Math.max(Math.ceil(total / limitNum), 1),
    });
  } catch (error) {
    console.error("GET MEETINGS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMeetingById = async (req, res) => {
  try {
    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id || req.user._id;

    const data = await Meeting.findOne(query)
      .populate("leadId", "name email phone")
      .populate("inquiryId", "name email phone")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email");

    if (!data) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.json({ success: true, data });
  } catch (error) {
    console.error("GET MEETING ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id || req.user._id;

    const current = await Meeting.findOne(query);
    if (!current) return res.status(404).json({ success: false, message: "Meeting not found" });

    const payload = await validateAndNormalizePayload(req, current);
    const assignedTo = payload.assignedTo || current.assignedTo || req.user.id || req.user._id;

    const overlap = await checkConflict({
      companyId: req.user.companyId,
      meetingId: req.params.id,
      assignedTo,
      startDate: payload.startDate,
      endDate: payload.endDate,
    });

    if (overlap) {
      return res.status(400).json({ success: false, message: "Time slot already booked for this user." });
    }

    const startChanged = new Date(current.startDate).getTime() !== new Date(payload.startDate).getTime();
    if (startChanged) {
      payload.reminders = payload.reminders.map((reminder) => ({
        ...reminder,
        isSent: false,
        sentAt: null,
      }));
      payload.lastReminderSentAt = null;
    }

    const updated = await Meeting.findOneAndUpdate(
      query,
      { ...payload, assignedTo },
      { new: true }
    )
      .populate("leadId", "name email phone")
      .populate("inquiryId", "name email phone")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email");

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("UPDATE MEETING ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id || req.user._id;

    const deleted = await Meeting.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.json({ success: true, message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("DELETE MEETING ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.processDueMeetingReminders = async () => {
  const now = new Date();
  const dueMeetings = await Meeting.find({
    status: { $in: ACTIVE_STATUSES },
    startDate: { $gte: now },
    "reminders.isSent": false,
  }).populate("assignedTo", "name email");

  if (!dueMeetings.length) return;

  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  for (const meeting of dueMeetings) {
    let changed = false;
    const minutesUntilStart = Math.ceil((new Date(meeting.startDate).getTime() - now.getTime()) / 60000);

    for (const reminder of meeting.reminders) {
      if (reminder.isSent) continue;
      if (minutesUntilStart > reminder.minutesBefore) continue;

      if (reminder.channel === "system" && meeting.assignedTo?._id) {
        await createNotification({
          userId: meeting.assignedTo._id,
          companyId: meeting.companyId,
          branchId: meeting.branchId,
          title: "Meeting Reminder",
          message: `${meeting.title} starts in ${reminder.minutesBefore} minute(s).`,
          type: "reminder",
        });
      }

      if (reminder.channel === "email" && meeting.contactEmail) {
        const mailHtml = `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
            <h2 style="margin-bottom:12px;">Meeting Reminder</h2>
            <p>Your meeting <strong>${meeting.title}</strong> starts at <strong>${new Date(meeting.startDate).toLocaleString("en-IN")}</strong>.</p>
            ${meeting.meetingLink || meeting.onlineUrl ? `<p>Join link: <a href="${meeting.meetingLink || meeting.onlineUrl}">${meeting.meetingLink || meeting.onlineUrl}</a></p>` : ""}
            ${meeting.location ? `<p>Location: ${meeting.location}</p>` : ""}
          </div>
        `;

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: meeting.contactEmail,
          subject: `Reminder: ${meeting.title}`,
          html: mailHtml,
        });
      }

      reminder.isSent = true;
      reminder.sentAt = new Date();
      meeting.lastReminderSentAt = reminder.sentAt;
      changed = true;
    }

    if (changed) {
      await meeting.save();
    }
  }
};

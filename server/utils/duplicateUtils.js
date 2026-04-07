const mongoose = require("mongoose");
const Activity = require("../models/Activity");
const Todo = require("../models/Todo");
const Task = require("../models/Task");
const FollowUp = require("../models/FollowUp");
const Meeting = require("../models/Meeting");

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();
const normalizePhone = (value = "") => String(value || "").replace(/\D/g, "");

const buildDuplicateFilter = ({ companyId, type, email, phone, excludeId }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  const or = [];

  if (normalizedEmail) {
    or.push({ emailNormalized: normalizedEmail });
    or.push({ email: new RegExp(`^${escapeRegex(String(email || "").trim())}$`, "i") });
  }

  if (normalizedPhone) {
    or.push({ phoneNormalized: normalizedPhone });
    if (String(phone || "").trim()) {
      or.push({ phone: new RegExp(`^${escapeRegex(String(phone || "").trim())}$`, "i") });
    }
  }

  if (!or.length) return null;

  const filter = {
    companyId,
    type,
    isDeleted: false,
    $or: or,
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  return filter;
};

const findDuplicateCandidates = async (Model, { companyId, type, email, phone, excludeId }) => {
  const filter = buildDuplicateFilter({ companyId, type, email, phone, excludeId });
  if (!filter) return [];
  return Model.find(filter).sort({ createdAt: 1 }).lean();
};

const annotateDuplicates = async (Model, records, type) => {
  return Promise.all(
    (records || []).map(async (record) => {
      const duplicates = await findDuplicateCandidates(Model, {
        companyId: record.companyId,
        type,
        email: record.email,
        phone: record.phone,
        excludeId: record._id,
      });

      return {
        ...record,
        duplicateCount: duplicates.length,
        duplicateIds: duplicates.map((item) => item._id),
        duplicateTargetId: duplicates[0]?._id || null,
      };
    })
  );
};

const mergeText = (targetValue, sourceValue) => {
  const target = String(targetValue || "").trim();
  const source = String(sourceValue || "").trim();
  if (!source) return targetValue || "";
  if (!target) return sourceValue || "";
  if (target.includes(source)) return targetValue || "";
  return `${target}\n\nMerged duplicate notes:\n${source}`;
};

const mergeArrays = (targetArray = [], sourceArray = []) => [...new Set([...(targetArray || []), ...(sourceArray || [])])];

const mergePrimaryRecordData = (target, source) => {
  const assignIfEmpty = (field) => {
    if (!target[field] && source[field]) {
      target[field] = source[field];
    }
  };

  [
    "name",
    "email",
    "phone",
    "companyName",
    "source",
    "courseSelected",
    "location",
    "city",
    "state",
    "address",
    "zipCode",
    "cityId",
    "branchId",
    "assignedTo",
    "assignedBranchId",
    "assignedManagerId",
    "message",
  ].forEach(assignIfEmpty);

  target.notes = mergeText(target.notes, source.notes || source.message);
  if (Object.prototype.hasOwnProperty.call(target.toObject ? target.toObject() : target, "message")) {
    target.message = mergeText(target.message, source.message);
  }

  target.tags = mergeArrays(target.tags, source.tags);
  target.assignedSalesIds = mergeArrays(target.assignedSalesIds, source.assignedSalesIds);
  target.emailNormalized = normalizeEmail(target.email || source.email);
  target.phoneNormalized = normalizePhone(target.phone || source.phone);

  target.value = Math.max(Number(target.value || 0), Number(source.value || 0));
  target.expectedRevenue = Math.max(Number(target.expectedRevenue || 0), Number(source.expectedRevenue || 0));
  target.probability = Math.max(Number(target.probability || 0), Number(source.probability || 0));
  target.engagementScore = Math.max(Number(target.engagementScore || 0), Number(source.engagementScore || 0));
  target.rating = Math.max(Number(target.rating || 0), Number(source.rating || 0));
  target.testScore = Math.max(Number(target.testScore || 0), Number(source.testScore || 0));

  if ((!target.stageHistory || target.stageHistory.length === 0) && source.stageHistory?.length) {
    target.stageHistory = source.stageHistory;
  }

  return target;
};

const reassignLinkedDocuments = async ({ sourceId, targetId, type }) => {
  const updates = [];

  if (type === "LEAD") {
    updates.push(Activity.updateMany({ leadId: sourceId }, { $set: { leadId: targetId } }));
    updates.push(Todo.updateMany({ leadId: sourceId }, { $set: { leadId: targetId } }));
    updates.push(Task.updateMany({ leadId: sourceId }, { $set: { leadId: targetId } }));
    updates.push(FollowUp.updateMany({ leadId: sourceId }, { $set: { leadId: targetId } }));
    updates.push(Meeting.updateMany({ leadId: sourceId }, { $set: { leadId: targetId } }));
  } else {
    updates.push(Activity.updateMany({ inquiryId: sourceId }, { $set: { inquiryId: targetId } }));
    updates.push(Meeting.updateMany({ inquiryId: sourceId }, { $set: { inquiryId: targetId } }));
  }

  await Promise.all(updates);
};

module.exports = {
  annotateDuplicates,
  buildDuplicateFilter,
  findDuplicateCandidates,
  mergePrimaryRecordData,
  normalizeEmail,
  normalizePhone,
  reassignLinkedDocuments,
};

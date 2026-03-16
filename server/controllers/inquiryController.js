const Inquiry = require("../models/Inquiry");
const Lead = require("../models/Lead");
const User = require("../models/User");
const MasterData = require("../models/MasterData");
const { assignLeadAutomatically, calculateLeadScore } = require("../utils/leadManagement");
const Activity = require("../models/Activity");

// ── CREATE INQUIRY (Company Admin manually creates) ──────────────────────────
exports.createInquiry = async (req, res) => {
    try {
        console.log("Inquiry Creation Attempt:", {
            user: req.user?.id,
            role: req.user?.role,
            tokenCompanyId: req.user?.companyId,
            body: req.body
        });

        // ✅ ALWAYS from JWT token — never trust req.body.companyId
        const companyId = req.user?.companyId;
        // If company admin, allow choosing branch in body, else use user's branch
        const branchId = (req.user?.role === "company_admin") ? (req.body.branchId || null) : (req.user?.branchId || null);

        if (!companyId) {
            console.error("Critical: companyId missing from token for user", req.user?.id);
            return res.status(400).json({
                success: false,
                message: "Your account is not linked to a company. Please log out and back in."
            });
        }

        // Validate mandatory fields
        if (!req.body.name || !req.body.email) {
            return res.status(400).json({
                success: false,
                message: "Name and Email are required fields."
            });
        }

        const inquiry = await Inquiry.create({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone || "",
            companyName: req.body.companyName || "",
            message: req.body.message || "",
            source: req.body.source || "Manual",
            sourceId: req.body.sourceId || null,
            website: req.body.website || "",
            city: req.body.city || "",
            address: req.body.address || "",
            course: req.body.course || "",
            location: req.body.location || "",
            inquiryStatus: req.body.inquiryStatus || "Fresh",
            value: req.body.value || 0,
            status: "Open",
            companyId,
            branchId
        });

        if (req.body.sourceId) {
            const LeadSource = require("../models/LeadSource");
            const sourceObj = await LeadSource.findById(req.body.sourceId);
            if (sourceObj) {
                inquiry.source = sourceObj.name;
                await inquiry.save();
            }
        }

        console.log("Inquiry created:", inquiry._id, "for company:", companyId);
        res.status(201).json({ success: true, data: inquiry });
    } catch (err) {
        console.error("Inquiry Creation Error:", err);
        res.status(400).json({
            success: false,
            message: err.message || "An unexpected error occurred during inquiry creation."
        });
    }
};

// ── GET ALL INQUIRIES (RBAC filtered by role) ────────────────────────────────
exports.getInquiries = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized: Access denied" });
        }

        const { page = 1, limit = 20, search, status, isExternal } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        if (req.user.role !== "super_admin") {
            query.companyId = req.user.companyId;
            // Branch/sales see their branch OR unassigned (null) so external inquiries show
            if (req.user.role === "branch_manager" || req.user.role === "sales") {
                query.branchId = { $in: [req.user.branchId, null] };
            }
            // Sales sees inquiries assigned to them OR unassigned (null) so external inquiries show
            if (req.user.role === "sales") {
                query.assignedTo = { $in: [req.user.id, null] };
            }
        }
        if (search && String(search).trim()) {
            const regex = { $regex: String(search).trim(), $options: "i" };
            query.$or = [
                { name: regex },
                { email: regex },
                { phone: regex },
                { message: regex },
                { companyName: regex }
            ];
        }
        if (status && status !== "all") query.status = status;
        if (isExternal === "true" || isExternal === "1") query.isExternal = true;

        const baseQuery = {};
        if (req.user.role !== "super_admin") {
            baseQuery.companyId = req.user.companyId;
            if (req.user.role === "branch_manager" || req.user.role === "sales") {
                baseQuery.branchId = { $in: [req.user.branchId, null] };
            }
            if (req.user.role === "sales") {
                baseQuery.assignedTo = { $in: [req.user.id, null] };
            }
        }

        const [total, inquiries, totalExternal] = await Promise.all([
            Inquiry.countDocuments(query),
            Inquiry.find(query)
                .sort({ createdAt: -1 })
                .populate("companyId", "name")
                .populate("sourceId")
                .populate("assignedTo", "name email role")
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Inquiry.countDocuments({ ...baseQuery, isExternal: true })
        ]);

        res.json({
            success: true,
            data: inquiries,
            total,
            totalExternal,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (err) {
        console.error("GET INQUIRIES ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET SINGLE INQUIRY (same RBAC as list) ────────────────────────────────────
function buildInquiryQuery(req) {
    const query = {};
    if (req.user.role !== "super_admin") {
        query.companyId = req.user.companyId;
        if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
        if (req.user.role === "sales") query.assignedTo = req.user.id;
    }
    return query;
}

exports.getInquiryById = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
        const mongoose = require("mongoose");
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid Inquiry ID" });
        }
        const query = { _id: req.params.id, ...buildInquiryQuery(req) };
        const inquiry = await Inquiry.findOne(query)
            .populate("companyId", "name")
            .populate("sourceId")
            .populate("assignedTo", "name email role");
        if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });
        res.json({ success: true, data: inquiry });
    } catch (err) {
        console.error("GET INQUIRY BY ID ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── CONVERT INQUIRY → LEAD (with assignedTo) ─────────────────────────────────
exports.convertInquiryToLead = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

        const mongoose = require("mongoose");
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid Inquiry ID" });
        }

        const inquiry = await Inquiry.findById(req.params.id);
        if (!inquiry) {
            return res.status(404).json({ success: false, message: "Inquiry not found" });
        }
        if (inquiry.status === "Converted") {
            return res.status(400).json({ success: false, message: "Already converted to lead." });
        }

        // Resolve MasterData for status and source
        let defaultStatus = "New";
        const statusObj = await MasterData.findOne({
            companyId: inquiry.companyId,
            type: "lead_status",
            name: "New"
        });
        if (statusObj) defaultStatus = statusObj.name;

        let defaultSource = inquiry.source || "Website";
        const sourceObj = await MasterData.findOne({
            companyId: inquiry.companyId,
            type: "lead_source",
            name: inquiry.source
        });
        if (sourceObj) defaultSource = sourceObj.name;

        // ✅ assignedTo from body, support explicitly passing `null` for auto-assign
        let assignedToId = req.body.hasOwnProperty("assignedTo") ? req.body.assignedTo : req.user.id;
        if (assignedToId === "") assignedToId = null;

        // Resolve branchId of the assigned user if not already present on inquiry
        let targetBranchId = inquiry.branchId || req.user.branchId || null;
        if (assignedToId) {
            const assignedUser = await User.findById(assignedToId);
            if (assignedUser && assignedUser.branchId) {
                targetBranchId = assignedUser.branchId;
            }
        }

        const now = new Date();
        const lead = await Lead.create({
            name: inquiry.name,
            email: inquiry.email,
            phone: inquiry.phone,
            companyName: inquiry.companyName || "",
            notes: inquiry.message,
            city: inquiry.city || "",
            address: inquiry.address || "",
            course: inquiry.course || "",
            location: inquiry.location || "",
            inquiryStatus: inquiry.inquiryStatus || "",
            source: inquiry.source || defaultSource,
            sourceId: inquiry.sourceId || null,
            status: defaultStatus,
            stage: "new_lead",
            stageUpdatedAt: now,
            value: inquiry.value || 0,
            companyId: inquiry.companyId,
            branchId: targetBranchId,
            createdBy: req.user.id,
            assignedTo: assignedToId
        });

        // Auto assignment if no one was explicitly assigned
        if (!lead.assignedTo) {
            await assignLeadAutomatically(lead._id, req.user.companyId, lead.branchId);
        }

        // Calculate AI Lead Score
        await calculateLeadScore(lead._id);

        // Mark inquiry as Converted
        inquiry.status = "Converted";
        await inquiry.save();

        const populated = await Lead.findById(lead._id)
            .populate("assignedTo", "name email role")
            .populate("createdBy", "name email");

        // STEP 9 - NOTIFICATION TRIGGER: Inquiry/Lead Assigned
        if (assignedToId) {
            const { createNotification } = require("../utils/notificationService");
            await createNotification({
                userId: assignedToId,
                companyId: lead.companyId,
                title: "New Lead Assigned",
                message: `You have been assigned a new lead from an inquiry: ${lead.name}`,
                type: "info"
            });
        }

        // LOG ACTIVITY
        await Activity.create({
            leadId: lead._id,
            userId: req.user.id,
            companyId: lead.companyId,
            type: "system",
            note: `Inquiry from ${inquiry.source || "Website"} converted to Lead`
        });

        res.json({
            success: true,
            message: "Inquiry converted to Lead successfully.",
            data: populated
        });
    } catch (err) {
        console.error("CONVERT INQUIRY ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── ASSIGN INQUIRY TO SALESMAN (manager / company_admin only) ─────────────────
exports.assignInquiry = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
        const allowedRoles = ["company_admin", "branch_manager", "super_admin"];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Only admin or branch manager can assign inquiries." });
        }

        const mongoose = require("mongoose");
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid Inquiry ID" });
        }

        const inquiry = await Inquiry.findById(req.params.id);
        if (!inquiry) {
            return res.status(404).json({ success: false, message: "Inquiry not found" });
        }

        // Access check: super_admin can touch any; others by company/branch
        if (req.user.role !== "super_admin") {
            if (String(inquiry.companyId) !== String(req.user.companyId)) {
                return res.status(403).json({ success: false, message: "Inquiry does not belong to your company." });
            }
            if (req.user.role === "branch_manager" && String(inquiry.branchId) !== String(req.user.branchId)) {
                return res.status(403).json({ success: false, message: "Inquiry does not belong to your branch." });
            }
        }

        const assignedToId = req.body.assignedTo === "" || req.body.assignedTo === null ? null : req.body.assignedTo;
        if (assignedToId) {
            const assignedUser = await User.findById(assignedToId);
            if (!assignedUser || assignedUser.status !== "active") {
                return res.status(400).json({ success: false, message: "Selected user not found or inactive." });
            }
            if (req.user.role === "branch_manager") {
                if (String(assignedUser.branchId) !== String(req.user.branchId)) {
                    return res.status(400).json({ success: false, message: "You can only assign to a salesman in your branch." });
                }
            }
            if (req.user.role === "company_admin" && assignedUser.companyId && String(assignedUser.companyId) !== String(inquiry.companyId)) {
                return res.status(400).json({ success: false, message: "Selected user must belong to the same company." });
            }
        }

        inquiry.assignedTo = assignedToId || undefined;
        await inquiry.save();

        const populated = await Inquiry.findById(inquiry._id).populate("assignedTo", "name email role");
        res.json({ success: true, message: "Inquiry assignment updated.", data: populated });
    } catch (err) {
        console.error("ASSIGN INQUIRY ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── UPDATE INQUIRY STATUS (Open / Ignored) ────────────────────────────────────
exports.updateInquiryStatus = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

        const mongoose = require("mongoose");
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid Inquiry ID" });
        }

        const filter = { _id: req.params.id };
        if (req.user.role !== "super_admin") filter.companyId = req.user.companyId;
        const inquiry = await Inquiry.findOneAndUpdate(
            filter,
            { status: req.body.status },
            { new: true }
        );
        if (!inquiry) {
            return res.status(404).json({ success: false, message: "Inquiry not found." });
        }
        res.json({ success: true, data: inquiry });
    } catch (err) {
        console.error("UPDATE INQUIRY STATUS ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── DELETE INQUIRY ────────────────────────────────────────────────────────────
exports.deleteInquiry = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

        const mongoose = require("mongoose");
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid Inquiry ID" });
        }

        const deleteFilter = { _id: req.params.id };
        if (req.user.role !== "super_admin") deleteFilter.companyId = req.user.companyId;
        const deleted = await Inquiry.findOneAndDelete(deleteFilter);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Inquiry not found or access denied." });
        }

        res.json({ success: true, message: "Inquiry deleted." });
    } catch (err) {
        console.error("DELETE INQUIRY ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

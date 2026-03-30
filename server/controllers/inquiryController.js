const Inquiry = require("../models/Inquiry");
const Lead = require("../models/Lead");
const User = require("../models/User");
const MasterData = require("../models/MasterData");
const { assignLeadAutomatically, calculateLeadScore } = require("../utils/leadManagement");
const { getNextCustomId } = require("../utils/idGenerator");
const Activity = require("../models/Activity");
const mongoose = require("mongoose");
const { getRBACFilter, validateAssignment } = require("../utils/rbac");

// ── CREATE INQUIRY ───────────────────────────────────────────────────────────
exports.createInquiry = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        let branchId = (req.user?.role === "company_admin") ? (req.body.branchId || null) : (req.user?.branchId || null);

        if (!companyId) {
            return res.status(400).json({ success: false, message: "Company ID missing from token." });
        }

        // If no branchId provided (e.g. Company Admin creating), find a default branch
        if (!branchId) {
            const Branch = require("../models/Branch");
            const firstBranch = await Branch.findOne({ companyId });
            if (!firstBranch) {
                return res.status(400).json({ success: false, message: "No branches found for this company. Please create a branch first." });
            }
            branchId = firstBranch._id;
        }

        const { name, email, phone, message, source, courseSelected, testScore, assignedTo } = req.body;
        if (!name || !email) {
            return res.status(400).json({ success: false, message: "Name and Email are required fields." });
        }

        // 1. DUPLICATE PREVENTION: Only for landing pages/automated sources
        let inquiry = null;
        if (source !== "manual") {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            inquiry = await Inquiry.findOne({
                companyId,
                $or: [{ email }, { phone: phone || "NONE" }],
                createdAt: { $gte: twentyFourHoursAgo }
            });
        }

        if (inquiry) {
            // Update existing inquiry (Landing Page Spam Prevention)
            inquiry.name = name;
            inquiry.message = message || inquiry.message;
            inquiry.courseSelected = courseSelected || inquiry.courseSelected;
            inquiry.testScore = testScore || inquiry.testScore;
            inquiry.source = source || inquiry.source;
            // Ensure branchId for legacy data during duplicate update
            if (!inquiry.branchId) {
                const Branch = require("../models/Branch");
                const firstBranch = await Branch.findOne({ companyId });
                if (firstBranch) inquiry.branchId = firstBranch._id;
            }
            await inquiry.save();

            // Log update
            await Activity.create({
                inquiryId: inquiry._id,
                userId: req.user?.id || null, // Can be null if from landing page
                companyId,
                type: "inquiry",
                note: "Inquiry record updated (Duplicate prevented)"
            });
        } else {
            // Create new
             const Branch = require("../models/Branch");
             let finalBranchId = branchId;
             if (!finalBranchId) {
                 const firstBranch = await Branch.findOne({ companyId });
                 if (firstBranch) finalBranchId = firstBranch._id;
             }

             // LAST RESORT: If still no branch and user is super_admin, we might need a branch
             if (!finalBranchId && req.user?.role === "super_admin") {
                 // Super admin creating inquiry for a company should specify a branch, 
                 // but for now we find ANY branch of that company
                 const firstBranch = await Branch.findOne({ companyId });
                 if (firstBranch) finalBranchId = firstBranch._id;
             }
             
             if (!finalBranchId) {
                 return res.status(400).json({ success: false, message: "A branch must be associated with the inquiry. Please ensure at least one branch exists for the company." });
             }

             inquiry = await Inquiry.create({
                 name,
                 email,
                 phone: phone || "",
                 companyName: req.body.companyName || "",
                 message: message || "",
                 source: source || "landing_page",
                 courseSelected,
                 testScore: testScore || 0,
                 status: "new",
                 type: "INQUIRY", // Default to Inquiry
                 assignedTo: assignedTo || null,
                 companyId,
                 branchId: finalBranchId,
                 createdBy: req.user?.id || null
             });

            // Create Activity log
            await Activity.create({
                inquiryId: inquiry._id,
                userId: req.user?.id || null,
                companyId,
                type: "inquiry",
                note: "New inquiry captured"
            });
        }

        // 2. Response
        res.status(201).json({ success: true, data: inquiry });
    } catch (err) {
        console.error("Inquiry Capture Error:", err);
        res.status(400).json({ success: false, message: err.message });
    }
};

// HELPER: Core conversion logic
exports.performConversion = async (inquiry, userId) => {
    // Resolve default lead status from MasterData
    let defaultStatus = "ASSIGNED";
    
    // Generate a proper Custom ID for the lead
    const customId = !inquiry.customId ? await getNextCustomId({ 
        companyId: inquiry.companyId, 
        module: "lead" 
    }) : inquiry.customId;

    // UPDATE INSTEAD OF CREATE NEW
    inquiry.type = "LEAD";
    inquiry.status = "ASSIGNED";
    inquiry.stage = "New";
    inquiry.stageUpdatedAt = new Date();
    inquiry.customId = customId;
    inquiry.createdBy = inquiry.createdBy || userId;

    // Safety check for branchId on conversion
    if (!inquiry.branchId) {
        const Branch = require("../models/Branch");
        const firstBranch = await Branch.findOne({ companyId: inquiry.companyId });
        if (firstBranch) inquiry.branchId = firstBranch._id;
    }
    
    await inquiry.save();

    // Lead Score
    await calculateLeadScore(inquiry._id);

    // Log Activity
    await Activity.create({
        inquiryId: inquiry._id,
        userId,
        companyId: inquiry.companyId,
        type: "system",
        note: "Automatically converted to Lead upon assignment"
    });

    return inquiry;
};

// ── GET ALL INQUIRIES ────────────────────────────────────────────────────────
exports.getInquiries = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status, source } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

         const query = getRBACFilter(req.user, { type: "INQUIRY" });

         if (search && String(search).trim()) {
             const regex = { $regex: String(search).trim(), $options: "i" };
             query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
         }
         if (status && status !== "all") query.status = status;
         if (source && source !== "all") query.source = source;

         const finalQuery = query;

        const [total, inquiries] = await Promise.all([
            Inquiry.countDocuments(finalQuery),
            Inquiry.find(finalQuery)
                .sort({ createdAt: -1 })
                .populate("companyId", "name")
                .populate("assignedTo", "name email role")
                .skip(skip)
                .limit(limitNum)
                .lean()
        ]);

        res.json({
            success: true,
            data: inquiries,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET SINGLE INQUIRY ───────────────────────────────────────────────────────
exports.getInquiryById = async (req, res) => {
    try {
        const query = getRBACFilter(req.user, { _id: req.params.id });

        const inquiry = await Inquiry.findOne(query)
            .populate("companyId", "name")
            .populate("assignedTo", "name email role");

        if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });

        // Find associated lead if it exists
        let leadIdFromLead = inquiry.leadId;
        if (!leadIdFromLead && inquiry.status === "converted") {
            const associatedLead = await Lead.findOne({ inquiryId: inquiry._id }).select("_id").lean();
            if (associatedLead) leadIdFromLead = associatedLead._id;
        }

        // Fetch activities for inquiry history
        const activities = await Activity.find({ inquiryId: inquiry._id })
            .sort({ createdAt: -1 })
            .populate("userId", "name role");

        res.json({ 
            success: true, 
            data: { 
                ...inquiry.toObject(), 
                leadId: leadIdFromLead 
            }, 
            activities 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── UPDATE INQUIRY (General & Status Change) ────────────────────────────────
exports.updateInquiry = async (req, res) => {
    try {
        const query = getRBACFilter(req.user, { _id: req.params.id });

        const inquiry = await Inquiry.findOne(query);
        if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found." });

        const oldStatus = inquiry.status;
        const updates = req.body;

        // Apply updates
        Object.keys(updates).forEach(key => {
            if (key !== "_id" && key !== "companyId") {
                inquiry[key] = updates[key];
            }
        });

        // Ensure branchId for legacy data
        if (!inquiry.branchId) {
            const Branch = require("../models/Branch");
            const firstBranch = await Branch.findOne({ companyId: inquiry.companyId });
            if (firstBranch) inquiry.branchId = firstBranch._id;
        }

        await inquiry.save();

        // Log status change activity
        if (updates.status && updates.status !== oldStatus) {
            await Activity.create({
                inquiryId: inquiry._id,
                userId: req.user.id,
                companyId: inquiry.companyId,
                type: "inquiry",
                note: `Status changed from ${oldStatus} to ${updates.status}`
            });
        }

        res.json({ success: true, data: inquiry });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── CONVERT INQUIRY → LEAD ───────────────────────────────────────────────────
exports.convertInquiryToLead = async (req, res) => {
    try {
        const query = getRBACFilter(req.user, { _id: req.params.id });
        const inquiry = await Inquiry.findOne(query);
        if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found." });
        if (inquiry.status === "converted") return res.status(400).json({ success: false, message: "Already converted." });

        const lead = await exports.performConversion(inquiry, req.user.id);

        res.json({ 
            success: true, 
            message: "Inquiry converted to Lead successfully.", 
            leadId: lead._id 
        });
    } catch (err) {
        console.error("CONVERT INQUIRY ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

 // ── ASSIGN INQUIRY ──────────────────────────────────────────────────────────
exports.assignInquiry = async (req, res) => {
    try {
        const { assignedTo } = req.body;
        if (!assignedTo) return res.status(400).json({ success: false, message: "assignedTo is required" });

        const query = getRBACFilter(req.user, { _id: req.params.id });
        const inquiry = await Inquiry.findOne(query);
        if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });

        const targetUser = await User.findById(assignedTo);
        if (!targetUser) return res.status(404).json({ success: false, message: "Target user not found" });

        // ROLE BASED ASSIGNMENT VALIDATION
        try {
            validateAssignment(req.user, targetUser, inquiry);
        } catch (error) {
            return res.status(403).json({ success: false, message: error.message });
        }

        inquiry.assignedTo = assignedTo;
        inquiry.type = "LEAD"; // AUTO CONVERT
        inquiry.status = "ASSIGNED";
        inquiry.stage = "New";
        
        // Ensure branchId is set correctly based on assignee
        if (targetUser.branchId) {
            inquiry.branchId = targetUser.branchId;
        } else if (!inquiry.branchId) {
            // Fallback for legacy data with null branchId
            const Branch = require("../models/Branch");
            const firstBranch = await Branch.findOne({ companyId: inquiry.companyId });
            if (firstBranch) inquiry.branchId = firstBranch._id;
        }

        await inquiry.save();
        
        // Lead Score
        await calculateLeadScore(inquiry._id);

        // LOG ACTIVITY
        await Activity.create({
            inquiryId: inquiry._id,
            userId: req.user.id,
            companyId: inquiry.companyId,
            branchId: inquiry.branchId || null,
            type: "inquiry",
            note: `Inquiry assigned to ${targetUser.name}`
        });

        res.json({ success: true, message: "Inquiry assigned successfully", data: inquiry });
    } catch (error) {
        console.error("ASSIGN INQUIRY ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── DELETE INQUIRY ────────────────────────────────────────────────────────────
exports.deleteInquiry = async (req, res) => {
    try {
        const filter = getRBACFilter(req.user, { _id: req.params.id });
        
        const deleted = await Inquiry.findOneAndDelete(filter);
        if (!deleted) return res.status(404).json({ success: false, message: "Inquiry not found." });

        res.json({ success: true, message: "Inquiry deleted." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


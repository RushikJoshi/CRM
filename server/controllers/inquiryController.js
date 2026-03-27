const Inquiry = require("../models/Inquiry");
const Lead = require("../models/Lead");
const User = require("../models/User");
const MasterData = require("../models/MasterData");
const { assignLeadAutomatically, calculateLeadScore } = require("../utils/leadManagement");
const { getNextCustomId } = require("../utils/idGenerator");
const Activity = require("../models/Activity");
const mongoose = require("mongoose");

// ── CREATE INQUIRY ───────────────────────────────────────────────────────────
exports.createInquiry = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const branchId = (req.user?.role === "company_admin") ? (req.body.branchId || null) : (req.user?.branchId || null);

        if (!companyId) {
            return res.status(400).json({ success: false, message: "Company ID missing from token." });
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
            inquiry = await Inquiry.create({
                name,
                email,
                phone: phone || "",
                message: message || "",
                source: source || "landing_page",
                courseSelected,
                testScore: testScore || 0,
                status: "new",
                assignedTo: assignedTo || null,
                companyId,
                branchId
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
    let defaultStatus = "New";
    const statusObj = await MasterData.findOne({ companyId: inquiry.companyId, type: "lead_status", name: "New" });
    if (statusObj) defaultStatus = statusObj.name;

    // Generate a proper Custom ID for the lead
    const customId = await getNextCustomId({ 
        companyId: inquiry.companyId, 
        module: "lead" 
    });

    const lead = await Lead.create({
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        source: "inquiry",
        notes: inquiry.message,
        courseSelected: inquiry.courseSelected,
        testScore: inquiry.testScore,
        proctoringScore: inquiry.proctoringScore || 100,
        proctoringRisk: inquiry.proctoringRisk || "Low",
        testToken: inquiry.testToken,
        proctoringStatus: inquiry.proctoringStatus,
        inquiryId: inquiry._id,
        status: defaultStatus,
        stage: "New", // Align with primary pipeline stage
        companyId: inquiry.companyId,
        branchId: inquiry.branchId,
        assignedTo: inquiry.assignedTo || null,
        createdBy: userId,
        customId
    });

    // Auto assignment
    if (!lead.assignedTo) {
        await assignLeadAutomatically(lead._id, inquiry.companyId, lead.branchId);
    }

    // Lead Score
    await calculateLeadScore(lead._id);

    // Update Inquiry
    inquiry.status = "converted";
    inquiry.leadId = lead._id;
    await inquiry.save();

    // Log Activity for Lead
    await Activity.create({
        leadId: lead._id,
        userId,
        companyId: lead.companyId,
        type: "system",
        note: "Converted from Inquiry (Funnels)"
    });

    // Log Activity for Inquiry
    await Activity.create({
        inquiryId: inquiry._id,
        userId,
        companyId: inquiry.companyId,
        type: "inquiry",
        note: "Inquiry converted to Lead record"
    });

    return lead;
};

// ── GET ALL INQUIRIES ────────────────────────────────────────────────────────
exports.getInquiries = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status, source } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        const query = { $and: [] };
        
        if (req.user.role !== "super_admin") {
            query.$and.push({ companyId: req.user.companyId });
            if (req.user.role === "branch_manager") {
                query.$and.push({ branchId: req.user.branchId });
            }
            if (req.user.role === "sales") {
                query.$and.push({
                    $or: [
                        { assignedTo: req.user.id },
                        { assignedTo: null }
                    ]
                });
            }
        }

        if (search && String(search).trim()) {
            const regex = { $regex: String(search).trim(), $options: "i" };
            query.$and.push({
                $or: [{ name: regex }, { email: regex }, { phone: regex }]
            });
        }
        if (status && status !== "all") query.$and.push({ status });
        if (source && source !== "all") query.$and.push({ source });

        // Clean query if nothing in $and
        const finalQuery = query.$and.length > 0 ? query : {};

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
        const query = { _id: req.params.id };
        if (req.user.role !== "super_admin") query.companyId = req.user.companyId;

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
        const query = { _id: req.params.id };
        if (req.user.role !== "super_admin") query.companyId = req.user.companyId;

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
        const inquiry = await Inquiry.findOne({ _id: req.params.id, companyId: req.user.companyId });
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

// ── DELETE INQUIRY ────────────────────────────────────────────────────────────
exports.deleteInquiry = async (req, res) => {
    try {
        const filter = { _id: req.params.id };
        if (req.user.role !== "super_admin") filter.companyId = req.user.companyId;
        
        const deleted = await Inquiry.findOneAndDelete(filter);
        if (!deleted) return res.status(404).json({ success: false, message: "Inquiry not found." });

        res.json({ success: true, message: "Inquiry deleted." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


const Inquiry = require("../models/Inquiry");
const Lead = require("../models/Lead");
const User = require("../models/User");
const MasterData = require("../models/MasterData");

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
            website: req.body.website || "",
            status: "Open",
            companyId,
            branchId
        });

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
        let query = {};

        if (req.user.role === "company_admin") {
            // Company admin sees ALL inquiries for their company
            query.companyId = req.user.companyId;
        } else if (req.user.role === "branch_manager" || req.user.role === "sales") {
            // Branch manager and sales see only their branch
            query.companyId = req.user.companyId;
            query.branchId = req.user.branchId;
        }

        const inquiries = await Inquiry.find(query)
            .sort({ createdAt: -1 })
            .populate("companyId", "name");

        res.json({ success: true, data: inquiries });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── CONVERT INQUIRY → LEAD (with assignedTo) ─────────────────────────────────
exports.convertInquiryToLead = async (req, res) => {
    try {
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
        if (statusObj) defaultStatus = statusObj._id;

        let defaultSource = inquiry.source || "Website";
        const sourceObj = await MasterData.findOne({
            companyId: inquiry.companyId,
            type: "lead_source",
            name: inquiry.source
        });
        if (sourceObj) defaultSource = sourceObj._id;

        // ✅ assignedTo from body OR fallback to logged-in user
        const assignedToId = req.body.assignedTo || req.user.id;

        // Resolve branchId of the assigned user if not already present on inquiry
        let targetBranchId = inquiry.branchId || req.user.branchId || null;
        if (assignedToId) {
            const assignedUser = await User.findById(assignedToId);
            if (assignedUser && assignedUser.branchId) {
                targetBranchId = assignedUser.branchId;
            }
        }

        const lead = await Lead.create({
            name: inquiry.name,
            email: inquiry.email,
            phone: inquiry.phone,
            companyName: inquiry.companyName || "",
            notes: inquiry.message,
            source: defaultSource,
            status: defaultStatus,
            companyId: inquiry.companyId,
            branchId: targetBranchId,
            createdBy: req.user.id,
            assignedTo: assignedToId
        });

        // Mark inquiry as Converted
        inquiry.status = "Converted";
        await inquiry.save();

        const populated = await Lead.findById(lead._id)
            .populate("assignedTo", "name email role")
            .populate("createdBy", "name email");

        res.json({
            success: true,
            message: "Inquiry converted to Lead successfully.",
            lead: populated
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── UPDATE INQUIRY STATUS (Open / Ignored) ────────────────────────────────────
exports.updateInquiryStatus = async (req, res) => {
    try {
        const inquiry = await Inquiry.findOneAndUpdate(
            { _id: req.params.id, companyId: req.user.companyId },
            { status: req.body.status },
            { new: true }
        );
        if (!inquiry) {
            return res.status(404).json({ success: false, message: "Inquiry not found." });
        }
        res.json({ success: true, data: inquiry });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── DELETE INQUIRY ────────────────────────────────────────────────────────────
exports.deleteInquiry = async (req, res) => {
    try {
        await Inquiry.findOneAndDelete({
            _id: req.params.id,
            companyId: req.user.companyId  // ✅ safety — can only delete own company's inquiries
        });
        res.json({ success: true, message: "Inquiry deleted." });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

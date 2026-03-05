const Inquiry = require("../models/Inquiry");
const Lead = require("../models/Lead");
const MasterData = require("../models/MasterData");

exports.createInquiry = async (req, res) => {
    try {
        const inquiry = new Inquiry({
            ...req.body,
            companyId: req.user.companyId || req.body.companyId,
            branchId: req.user.branchId || req.body.branchId
        });
        await inquiry.save();
        res.status(201).json({ success: true, data: inquiry });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getInquiries = async (req, res) => {
    try {
        let query = { status: { $ne: "Converted" } };

        // RBAC
        if (req.user.role === "company_admin") {
            query.companyId = req.user.companyId;
        } else if (req.user.role === "branch_manager") {
            query.companyId = req.user.companyId;
            query.branchId = req.user.branchId;
        } else if (req.user.role === "sales") {
            query.companyId = req.user.companyId;
            query.branchId = req.user.branchId;
        }

        const inquiries = await Inquiry.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: inquiries });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.convertInquiryToLead = async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id);
        if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });

        // Create Lead
        const lead = new Lead({
            name: inquiry.name,
            email: inquiry.email,
            phone: inquiry.phone,
            companyName: inquiry.companyName,
            notes: inquiry.message,
            companyId: inquiry.companyId,
            branchId: inquiry.branchId,
            createdBy: req.user.id,
            // Status and Source will be handled by MasterData or defaults
        });

        // Find or create default "New" status for the company
        let statusObj = await MasterData.findOne({ companyId: inquiry.companyId, type: "lead_status", name: "New" });
        if (statusObj) lead.status = statusObj._id;

        let sourceObj = await MasterData.findOne({ companyId: inquiry.companyId, type: "lead_source", name: inquiry.source });
        if (sourceObj) lead.source = sourceObj._id;

        await lead.save();

        // Mark inquiry as converted
        inquiry.status = "Converted";
        await inquiry.save();

        res.json({ success: true, data: lead });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteInquiry = async (req, res) => {
    try {
        await Inquiry.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Inquiry deleted" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

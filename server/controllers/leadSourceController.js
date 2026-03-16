const LeadSource = require("../models/LeadSource");

// ── GET ALL LEAD SOURCES ────────────────────────────────────────────────────
exports.getLeadSources = async (req, res) => {
    try {
        const { companyId } = req.user;
        const sources = await LeadSource.find({ companyId, isActive: true });
        res.json({ success: true, data: sources });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── CREATE LEAD SOURCE ──────────────────────────────────────────────────────
exports.createLeadSource = async (req, res) => {
    try {
        const { name, type } = req.body;
        const { companyId, id: userId } = req.user;

        const source = await LeadSource.create({
            name,
            type,
            companyId,
            createdBy: userId
        });

        res.status(201).json({ success: true, data: source });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

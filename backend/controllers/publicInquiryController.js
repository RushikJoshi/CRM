const Inquiry = require("../models/Inquiry");
const Company = require("../models/Company");

exports.publicCreateInquiry = async (req, res) => {
    try {
        const { name, email, phone, message, source, website, companyId } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({ success: false, message: "name, email, phone are required." });
        }
        if (!companyId) {
            return res.status(400).json({ success: false, message: "companyId is required." });
        }

        const company = await Company.findOne({ _id: companyId, status: "active" });
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found or inactive." });
        }

        const inquiry = await Inquiry.create({
            name, email, phone,
            message: message || "",
            source: source || "External Form",
            website: website || "",
            companyId,
            status: "Open"
        });

        res.status(201).json({ success: true, message: "Inquiry received successfully.", id: inquiry._id });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error." });
    }
};

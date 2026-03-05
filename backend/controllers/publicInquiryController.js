const Inquiry = require("../models/Inquiry");

/**
 * PUBLIC endpoint — no auth required.
 * Called by WordPress / external forms (CRM Inquiry Integration).
 */
exports.publicCreateInquiry = async (req, res) => {
    try {
        const { name, email, phone, message, source, website } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({ success: false, message: "Required fields missing." });
        }

        const inquiry = await Inquiry.create({
            name,
            email,
            phone,
            message: message || "",
            source: source || "External Form",
            website: website || "",
            status: "Open"
        });

        res.status(201).json({
            success: true,
            message: "Inquiry received.",
            id: inquiry._id
        });
    } catch (err) {
        console.error("Public inquiry error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

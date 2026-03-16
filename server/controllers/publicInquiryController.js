const Inquiry = require("../models/Inquiry");
const Company = require("../models/Company");
const Branch = require("../models/Branch");

exports.publicCreateInquiry = async (req, res) => {
    try {
        // Support multiple ways WordPress plugins send keys
        const apiKey =
            req.headers["x-api-key"] ||
            req.headers["X-API-KEY"] ||
            req.query.apiKey ||
            req.body?.apiKey ||
            req.body?.companyId;

        if (!apiKey) {
            return res.status(401).json({ success: false, message: "Missing x-api-key." });
        }

        const { name, email, phone, message, source, website, city, address, course, location } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({ success: false, message: "name, email, phone are required." });
        }
        // Normalize: ensure phone is string (WordPress may send number)
        const phoneStr = String(phone || "").trim();
        if (!phoneStr) {
            return res.status(400).json({ success: false, message: "phone is required." });
        }

        // Validate companyId using API key (in this CRM, API Key matches company objectId for simplicity)
        const companyId = apiKey;

        const company = await Company.findOne({ _id: companyId, status: "active" });
        if (!company) {
            console.warn("Public inquiry rejected: Company not found or inactive for apiKey:", companyId);
            return res.status(404).json({ success: false, message: "Company not found or inactive." });
        }

        // STEP 11 — DUPLICATE LEAD DETECTION
        const Lead = require("../models/Lead");
        let existingLead = await Lead.findOne({
            $or: [{ email }, { phone: phoneStr }],
            companyId,
            isDeleted: false
        });

        let existingLeadId = null;
        if (existingLead) {
            existingLead.notes = (existingLead.notes || "") + "\n\nNew Inquiry: " + (message || "No message");
            await existingLead.save();
            existingLeadId = existingLead._id;
        }

        // Try to map the submitted location (eg. "Ahmedabad") to a branch of this company
        let branchId = null;
        if (location) {
            const normalizedLocation = String(location).trim().toLowerCase();
            const branch = await Branch.findOne({
                companyId,
                isDeleted: false,
                status: "active",
                $or: [
                    { city: new RegExp(`^${normalizedLocation}$`, "i") },
                    { name: new RegExp(`^${normalizedLocation}$`, "i") }
                ]
            }).select("_id");
            if (branch) {
                branchId = branch._id;
            }
        }

        const inferredWebsite =
            (website && String(website).trim()) ||
            (req.headers.origin && String(req.headers.origin).trim()) ||
            (req.headers.referer && String(req.headers.referer).trim()) ||
            "";

        const inquiry = await Inquiry.create({
            name: String(name || "").trim(),
            email: String(email || "").trim(),
            phone: phoneStr,
            message: message || "",
            source: source || "Website Form",
            website: inferredWebsite,
            city: city || "",
            address: address || "",
            course: course || "",
            location: location || "",
            companyId,
            branchId,
            status: "Open",
            isExternal: true
        });

        // Automatically trigger lead creation from inquiry if needed, or just return
        // For now, satisfy Step 3 requirements for Stability
        console.log("New Inquiry created:", inquiry._id, "for company:", companyId);

        res.status(201).json({
            success: true,
            message: "Inquiry received successfully.",
            data: inquiry,
            leadId: existingLeadId,
            isUpdate: !!existingLeadId
        });
    } catch (err) {
        console.error("Public Inquiry Error:", err.message);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

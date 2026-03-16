const mongoose = require("mongoose");
const Inquiry = require("../models/Inquiry");
const Company = require("../models/Company");
const Branch = require("../models/Branch");

/** GET /api/public/check?apiKey=xxx — verify API key and that inquiries will show for that company */
exports.publicCheckApiKey = async (req, res) => {
    try {
        const apiKey = req.query.apiKey || req.headers["x-api-key"] || req.headers["X-API-KEY"];
        if (!apiKey) {
            return res.status(400).json({ success: false, message: "Provide apiKey in query or x-api-key header." });
        }
        if (!mongoose.Types.ObjectId.isValid(apiKey)) {
            return res.status(400).json({ success: false, message: "Invalid API key format (must be a valid MongoDB ObjectId)." });
        }
        const companyIdObj = new mongoose.Types.ObjectId(apiKey);
        const company = await Company.findOne({ _id: companyIdObj, status: "active" }).select("name status").lean();
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found or inactive. Use the exact Company _id from your CRM/MongoDB as x-api-key.",
                apiKeyUsed: String(apiKey)
            });
        }
        const inquiryCount = await Inquiry.countDocuments({ companyId: companyIdObj });
        res.json({
            success: true,
            message: "API key is valid. Inquiries from this company will appear in the Inquiry List.",
            companyId: String(companyIdObj),
            companyName: company.name,
            totalInquiriesForCompany: inquiryCount
        });
    } catch (err) {
        console.error("Public check error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

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

        // Validate companyId using API key (use ObjectId so it matches list query)
        let companyId;
        try {
            companyId = mongoose.Types.ObjectId.isValid(apiKey) ? new mongoose.Types.ObjectId(apiKey) : null;
        } catch {
            companyId = null;
        }
        if (!companyId) {
            return res.status(400).json({ success: false, message: "Invalid x-api-key format." });
        }
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

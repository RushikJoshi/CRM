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
        const inquiryCtrl = require("./inquiryController");
        const apiKey =
            req.headers["x-api-key"] ||
            req.headers["X-API-KEY"] ||
            req.query.apiKey ||
            req.body?.apiKey ||
            req.body?.companyId;

        if (!apiKey) {
            return res.status(401).json({ success: false, message: "Missing API Key (x-api-key)." });
        }

        const { name, email, phone, message, source, courseSelected, testScore, location } = req.body;

        if (!name || !email) {
            return res.status(400).json({ success: false, message: "name and email are required." });
        }

        // Validate company
        let companyId;
        try {
            companyId = mongoose.Types.ObjectId.isValid(apiKey) ? new mongoose.Types.ObjectId(apiKey) : null;
        } catch {
            companyId = null;
        }

        if (!companyId) return res.status(400).json({ success: false, message: "Invalid API Key format." });

        const company = await Company.findOne({ _id: companyId, status: "active" });
        if (!company) return res.status(404).json({ success: false, message: "Company not found or inactive." });

        // Normalize phone
        const phoneStr = phone ? String(phone).trim() : "";

        // 1. DUPLICATE PREVENTION: Check same phone OR email within last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        let inquiry = await Inquiry.findOne({
            companyId,
            $or: [{ email: String(email).trim().toLowerCase() }, { phone: phoneStr || "NONE" }],
            createdAt: { $gte: twentyFourHoursAgo }
        });

        if (inquiry) {
            // Update existing
            inquiry.name = name;
            inquiry.message = message || inquiry.message;
            inquiry.courseSelected = courseSelected || inquiry.courseSelected;
            inquiry.testScore = testScore || inquiry.testScore;
            await inquiry.save();
            
            // Log update
            const Activity = require("../models/Activity");
            await Activity.create({
                inquiryId: inquiry._id,
                companyId,
                type: "inquiry",
                note: "External Inquiry updated (Duplicate prevented)"
            });
        } else {
            // Mapping location to branch
            let branchId = null;
            if (location) {
                const branch = await Branch.findOne({
                    companyId,
                    isDeleted: false,
                    $or: [
                        { city: new RegExp(`^${String(location).trim()}$`, "i") },
                        { name: new RegExp(`^${String(location).trim()}$`, "i") }
                    ]
                });
                if (branch) branchId = branch._id;
            }

            // Create new
            inquiry = await Inquiry.create({
                name,
                email,
                phone: phoneStr,
                message: message || "",
                source: source || "landing_page",
                courseSelected,
                testScore: testScore || 0,
                status: "new",
                companyId,
                branchId
            });

            // Log activity
            const Activity = require("../models/Activity");
            await Activity.create({
                inquiryId: inquiry._id,
                companyId,
                type: "inquiry",
                note: "New External Inquiry captured"
            });
        }

        // 2. AUTO CONVERSION: If testScore >= 70
        if (inquiry.testScore >= 70 && inquiry.status !== "converted") {
            try {
                const lead = await inquiryCtrl.performConversion(inquiry, null);
                return res.status(201).json({
                    success: true,
                    message: "High score! Auto-converted to Lead.",
                    data: inquiry,
                    leadId: lead._id,
                    autoConverted: true
                });
            } catch (convErr) {
                console.error("Auto-conversion failed, proceeding with inquiry:", convErr);
            }
        }

        res.status(201).json({
            success: true,
            message: "Inquiry received successfully.",
            data: inquiry
        });
    } catch (err) {
        console.error("Public Inquiry Error:", err.message);
        res.status(500).json({ success: false, message: "Error processing submission. Please try again." });
    }
};

const mongoose = require("mongoose");
const Inquiry = require("../models/Inquiry");
const Company = require("../models/Company");
const Branch = require("../models/Branch");
const City = require("../models/City");
const leadRoutingService = require("../services/leadRouting.service");
const { normalizeEmail, normalizePhone } = require("../utils/duplicateUtils");

const normalizeText = (value = "") =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const buildNameRegex = (value = "") => new RegExp(`^${String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

const getDefaultBranch = async (companyId) => (
    Branch.findOne({
        companyId,
        isDeleted: false,
        status: "active",
    }).sort({ branchType: 1, createdAt: 1 })
);

const resolveBranchAndCity = async ({ companyId, location, city }) => {
    const cleanLocation = String(location || "").trim();
    const cleanCity = String(city || "").trim();
    let branch = null;
    let cityDoc = null;

    if (cleanLocation) {
        branch = await Branch.findOne({
            companyId,
            isDeleted: false,
            status: "active",
            $or: [
                { name: buildNameRegex(cleanLocation) },
                { city: buildNameRegex(cleanLocation) }
            ]
        }).populate("cityId", "name");
    }

    if (!cityDoc && cleanCity) {
        cityDoc = await City.findOne({ name: buildNameRegex(cleanCity), isActive: true }).lean();
    }

    if (!cityDoc && branch?.cityId) {
        cityDoc = branch.cityId;
    }

    if (!branch && cityDoc?._id) {
        branch = await Branch.findOne({
            companyId,
            isDeleted: false,
            status: "active",
            cityId: cityDoc._id
        }).populate("cityId", "name");
    }

    if (!branch && cleanCity) {
        const normalizedCity = normalizeText(cleanCity);
        const branches = await Branch.find({
            companyId,
            isDeleted: false,
            status: "active"
        }).populate("cityId", "name");

        branch = branches.find((item) => {
            const branchCity = normalizeText(item.city || item.cityId?.name || "");
            const branchName = normalizeText(item.name || "");
            return branchCity === normalizedCity || branchName === normalizedCity;
        }) || null;

        if (branch?.cityId && !cityDoc) {
            cityDoc = branch.cityId;
        }
    }

    if (!branch) {
        branch = await getDefaultBranch(companyId);
    }

    return {
        branch,
        cityId: cityDoc?._id || branch?.cityId?._id || branch?.cityId || null,
        resolvedCityName: cityDoc?.name || branch?.cityId?.name || cleanCity || cleanLocation || "",
        resolvedLocation: cleanLocation || branch?.name || ""
    };
};

const applyRouting = async ({ inquiry, companyId, branch, cityId }) => {
    inquiry.cityId = cityId || inquiry.cityId || null;

    if (branch?._id) {
        inquiry.branchId = branch._id;
        inquiry.assignedBranchId = branch._id;
        inquiry.assignedManagerId = branch.branchManagerId || null;
    }

    const routingResult = cityId
        ? await leadRoutingService.routeLead(cityId, companyId)
        : { status: "unassigned" };

    if (routingResult.status === "assigned") {
        inquiry.assignedTo = routingResult.assignedTo || inquiry.assignedTo || null;
        inquiry.assignedBranchId = routingResult.assignedBranchId || inquiry.assignedBranchId || inquiry.branchId || null;
        inquiry.assignedManagerId = routingResult.assignedManagerId || inquiry.assignedManagerId || null;
        inquiry.assignedSalesIds = routingResult.assignedSalesIds || inquiry.assignedSalesIds || [];
        inquiry.branchId = routingResult.assignedBranchId || inquiry.branchId;
        inquiry.status = "assigned";
        return;
    }

    inquiry.assignedTo = inquiry.assignedTo || inquiry.assignedManagerId || null;
    inquiry.assignedSalesIds = inquiry.assignedSalesIds || [];
    if (inquiry.assignedTo || inquiry.assignedManagerId) {
        inquiry.status = "assigned";
    }
};

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

        const { name, email, phone, message, source, courseSelected, testScore, location, city } = req.body;

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
        const normalizedEmail = normalizeEmail(email);
        const normalizedPhone = normalizePhone(phoneStr);

        // 1. DUPLICATE PREVENTION: Check same phone OR email within last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        let inquiry = await Inquiry.findOne({
            companyId,
            $or: [{ emailNormalized: normalizedEmail }, { phoneNormalized: normalizedPhone || "NONE" }],
            createdAt: { $gte: twentyFourHoursAgo }
        });

        if (inquiry) {
            // Update existing
            inquiry.name = name;
            inquiry.email = normalizedEmail;
            inquiry.emailNormalized = normalizedEmail;
            inquiry.phone = phoneStr;
            inquiry.phoneNormalized = normalizedPhone;
            inquiry.message = message || inquiry.message;
            inquiry.courseSelected = courseSelected || inquiry.courseSelected;
            inquiry.testScore = testScore || inquiry.testScore;
            inquiry.location = location || inquiry.location || "";
            inquiry.city = city || inquiry.city || "";
            const resolved = await resolveBranchAndCity({ companyId, location, city });
            await applyRouting({ inquiry, companyId, branch: resolved.branch, cityId: resolved.cityId });
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
            const resolved = await resolveBranchAndCity({ companyId, location, city });
            if (!resolved.branch?._id) {
                return res.status(400).json({
                    success: false,
                    message: "No active branch found for the selected location/city. Please configure branch-city mapping first."
                });
            }

            // Create new
            inquiry = await Inquiry.create({
                name,
                email: normalizedEmail,
                emailNormalized: normalizedEmail,
                phone: phoneStr,
                phoneNormalized: normalizedPhone,
                message: message || "",
                source: source || "landing_page",
                courseSelected,
                testScore: testScore || 0,
                status: "new",
                companyId,
                branchId: resolved.branch._id,
                location: resolved.resolvedLocation,
                city: city || resolved.resolvedCityName || "",
                cityId: resolved.cityId || null,
                assignedBranchId: resolved.branch._id,
                assignedManagerId: resolved.branch.branchManagerId || null
            });

            await applyRouting({ inquiry, companyId, branch: resolved.branch, cityId: resolved.cityId });
            await inquiry.save();

            // Log activity
            const Activity = require("../models/Activity");
            await Activity.create({
                inquiryId: inquiry._id,
                companyId,
                type: "inquiry",
                note: `New External Inquiry captured${inquiry.branchId ? ` and routed to branch ${resolved.branch.name}` : ""}`
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

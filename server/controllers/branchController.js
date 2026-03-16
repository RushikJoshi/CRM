const Branch = require("../models/Branch");

const BRANCH_TYPES = ["head_office", "regional_office", "sales_branch", "support_center", "warehouse"];
const BRANCH_STATUSES = ["active", "inactive", "closed"];

/** Sanitize body: only allow known fields and enums */
function sanitizeBranchBody(body) {
  const allowed = {
    name: body.name,
    branchCode: body.branchCode != null ? String(body.branchCode).trim().toUpperCase() || undefined : undefined,
    branchType: BRANCH_TYPES.includes(body.branchType) ? body.branchType : undefined,
    status: BRANCH_STATUSES.includes(body.status) ? body.status : undefined,
    email: body.email != null ? String(body.email).trim().toLowerCase() : undefined,
    phone: body.phone != null ? String(body.phone).trim() : undefined,
    alternatePhone: body.alternatePhone != null ? String(body.alternatePhone).trim() : undefined,
    website: body.website != null ? String(body.website).trim() : undefined,
    addressLine1: body.addressLine1 != null ? String(body.addressLine1).trim() : undefined,
    addressLine2: body.addressLine2 != null ? String(body.addressLine2).trim() : undefined,
    city: body.city != null ? String(body.city).trim() : undefined,
    state: body.state != null ? String(body.state).trim() : undefined,
    country: body.country != null ? String(body.country).trim() : undefined,
    postalCode: body.postalCode != null ? String(body.postalCode).trim() : undefined,
    latitude: body.latitude != null && body.latitude !== "" ? Number(body.latitude) : undefined,
    longitude: body.longitude != null && body.longitude !== "" ? Number(body.longitude) : undefined,
    branchManagerId: body.branchManagerId || null,
    managerEmail: body.managerEmail != null ? String(body.managerEmail).trim().toLowerCase() : undefined,
    managerPhone: body.managerPhone != null ? String(body.managerPhone).trim() : undefined,
    assignedUserIds: Array.isArray(body.assignedUserIds) ? body.assignedUserIds : undefined,
    openingDate: body.openingDate ? new Date(body.openingDate) : undefined,
    workingHours: body.workingHours != null ? String(body.workingHours).trim() : undefined,
    timezone: body.timezone != null ? String(body.timezone).trim() : undefined,
    branchCapacity: body.branchCapacity != null && body.branchCapacity !== "" ? Number(body.branchCapacity) : undefined,
    logoUrl: body.logoUrl != null ? String(body.logoUrl).trim() : undefined,
    description: body.description != null ? String(body.description).trim() : undefined,
    documentUrls: Array.isArray(body.documentUrls) ? body.documentUrls.filter(Boolean) : undefined,
    address: body.address != null ? String(body.address).trim() : undefined,
  };
  return Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined));
}

/** Auto-generate branch code: BR-{companyId short}-{count} */
async function generateBranchCode(companyId) {
  const count = await Branch.countDocuments({ companyId, isDeleted: false });
  const short = String(companyId).slice(-6).toUpperCase();
  return `BR-${short}-${String(count + 1).padStart(3, "0")}`;
}

// ── Create Branch ─────────────────────────────────────────────────────────
exports.createBranch = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    let companyId = req.user.companyId;
    if (req.user.role === "super_admin") {
      companyId = req.body.companyId || req.user.companyId;
    }
    if (!companyId) return res.status(400).json({ success: false, message: "Company is required" });

    const body = sanitizeBranchBody(req.body);
    let branchCode = body.branchCode;
    if (!branchCode || !branchCode.trim()) {
      branchCode = await generateBranchCode(companyId);
    } else {
      branchCode = String(branchCode).trim().toUpperCase();
      const exists = await Branch.findOne({ companyId, branchCode, isDeleted: false });
      if (exists) return res.status(400).json({ success: false, message: "Branch code already exists for this company" });
    }

    const branch = await Branch.create({
      ...body,
      branchCode,
      companyId,
      createdBy: req.user.id || req.user._id,
      updatedBy: req.user.id || req.user._id,
    });

    const populated = await Branch.findById(branch._id)
      .populate("companyId", "name")
      .populate("branchManagerId", "name email")
      .populate("assignedUserIds", "name email");
    res.status(201).json({ success: true, message: "Branch created successfully", data: populated });
  } catch (err) {
    console.error("CREATE BRANCH ERROR:", err);
    if (err.code === 11000) return res.status(400).json({ success: false, message: "Branch code already exists for this company" });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Branches (list with pagination, search, status filter) ─────────────
exports.getBranches = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { search, page = 1, limit = 20, status, companyId: queryCompanyId } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    let query = { isDeleted: false };

    if (req.user.role !== "super_admin") {
      query.companyId = req.user.companyId;
      if (req.user.role === "branch_manager") {
        query.$or = [
          { _id: req.user.branchId },
          { branchManagerId: req.user.id || req.user._id },
        ];
      }
    } else if (queryCompanyId) {
      query.companyId = queryCompanyId;
    }

    if (search && String(search).trim()) {
      const regex = { $regex: String(search).trim(), $options: "i" };
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: regex },
          { branchCode: regex },
          { email: regex },
          { city: regex },
          { state: regex },
        ],
      });
    }
    if (status && BRANCH_STATUSES.includes(status)) query.status = status;

    const [total, branches] = await Promise.all([
      Branch.countDocuments(query),
      Branch.find(query)
        .populate("companyId", "name")
        .populate("branchManagerId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      data: branches,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("GET BRANCHES ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get single branch by ID ─────────────────────────────────────────────────
exports.getBranchById = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { id } = req.params;
    let query = { _id: id, isDeleted: false };
    if (req.user.role !== "super_admin") {
      query.companyId = req.user.companyId;
      if (req.user.role === "branch_manager") {
        query.$or = [
          { _id: req.user.branchId },
          { branchManagerId: req.user.id || req.user._id },
        ];
      }
    }
    const branch = await Branch.findOne(query)
      .populate("companyId", "name")
      .populate("branchManagerId", "name email phone")
      .populate("assignedUserIds", "name email")
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .lean();
    if (!branch) return res.status(404).json({ success: false, message: "Branch not found" });
    res.json({ success: true, data: branch });
  } catch (err) {
    console.error("GET BRANCH BY ID ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update Branch ───────────────────────────────────────────────────────────
exports.updateBranch = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { id } = req.params;
    let query = { _id: id, isDeleted: false };
    if (req.user.role !== "super_admin") {
      query.companyId = req.user.companyId;
    }
    if (req.user.role === "branch_manager") {
      query.$or = [
        { _id: req.user.branchId },
        { branchManagerId: req.user.id || req.user._id },
      ];
    }

    const existing = await Branch.findOne(query);
    if (!existing) return res.status(404).json({ success: false, message: "Branch not found" });

    const body = sanitizeBranchBody(req.body);
    if (body.branchCode && body.branchCode !== existing.branchCode) {
      const duplicate = await Branch.findOne({
        companyId: existing.companyId,
        branchCode: body.branchCode,
        isDeleted: false,
        _id: { $ne: id },
      });
      if (duplicate) return res.status(400).json({ success: false, message: "Branch code already exists for this company" });
    }

    Object.assign(existing, body);
    existing.updatedBy = req.user.id || req.user._id;
    await existing.save();

    const populated = await Branch.findById(existing._id)
      .populate("companyId", "name")
      .populate("branchManagerId", "name email")
      .populate("assignedUserIds", "name email");
    res.json({ success: true, message: "Branch updated successfully", data: populated });
  } catch (err) {
    console.error("UPDATE BRANCH ERROR:", err);
    if (err.code === 11000) return res.status(400).json({ success: false, message: "Branch code already exists" });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Soft delete Branch ─────────────────────────────────────────────────────
exports.deleteBranch = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { id } = req.params;
    let query = { _id: id, isDeleted: false };
    if (req.user.role !== "super_admin") query.companyId = req.user.companyId;

    const branch = await Branch.findOne(query);
    if (!branch) return res.status(404).json({ success: false, message: "Branch not found" });

    branch.isDeleted = true;
    branch.updatedBy = req.user.id || req.user._id;
    await branch.save();
    res.json({ success: true, message: "Branch deleted successfully" });
  } catch (err) {
    console.error("DELETE BRANCH ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Toggle status (active/inactive) ─────────────────────────────────────────
exports.toggleBranchStatus = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { id } = req.params;
    let query = { _id: id, isDeleted: false };
    if (req.user.role !== "super_admin") query.companyId = req.user.companyId;

    const branch = await Branch.findOne(query);
    if (!branch) return res.status(404).json({ success: false, message: "Branch not found" });

    const nextStatus = branch.status === "active" ? "inactive" : "active";
    branch.status = nextStatus;
    branch.updatedBy = req.user.id || req.user._id;
    await branch.save();
    res.json({ success: true, data: branch, message: `Branch marked as ${nextStatus}` });
  } catch (err) {
    console.error("TOGGLE BRANCH STATUS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const User = require("../models/User");
const bcrypt = require("bcryptjs");

const ROLES = ["super_admin", "company_admin", "branch_manager", "sales", "support", "marketing"];
const STATUSES = ["active", "inactive", "suspended", "pending", "draft"];
const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract"];

function sanitizeUserBody(body) {
  const str = (v) => (v != null && v !== "" ? String(v).trim() : undefined);
  const num = (v) => (v !== "" && v != null && !Number.isNaN(Number(v)) ? Number(v) : undefined);
  const date = (v) => (v ? new Date(v) : undefined);
  const obj = (v) => (v && typeof v === "object" ? v : undefined);

  return {
    name: str(body.name),
    email: body.email != null ? str(body.email).toLowerCase() : undefined,
    password: body.password != null && String(body.password).trim() ? body.password : undefined,
    role: ROLES.includes(body.role) ? body.role : undefined,
    companyId: body.companyId || undefined,
    branchId: body.branchId || body.primaryBranchId || undefined,
    status: STATUSES.includes(body.status) ? body.status : undefined,

    firstName: str(body.firstName),
    lastName: str(body.lastName),
    displayName: str(body.displayName),
    profilePhotoUrl: str(body.profilePhotoUrl),
    gender: ["male", "female", "other", ""].includes(body.gender) ? body.gender : undefined,
    dateOfBirth: date(body.dateOfBirth),

    workEmail: body.workEmail != null ? str(body.workEmail).toLowerCase() : undefined,
    personalEmail: body.personalEmail != null ? str(body.personalEmail).toLowerCase() : undefined,
    phone: str(body.phone),
    alternatePhone: str(body.alternatePhone),
    whatsappNumber: str(body.whatsappNumber),
    address: str(body.address),

    username: str(body.username),
    twoFactorEnabled: body.twoFactorEnabled === true || body.twoFactorEnabled === "true",

    department: str(body.department),
    reportingManagerId: body.reportingManagerId || null,
    permissionLevel: str(body.permissionLevel),

    primaryBranchId: body.primaryBranchId || undefined,
    additionalBranchIds: Array.isArray(body.additionalBranchIds) ? body.additionalBranchIds.filter(Boolean) : undefined,
    team: str(body.team),
    territory: str(body.territory),

    employeeId: str(body.employeeId),
    jobTitle: str(body.jobTitle),
    joiningDate: date(body.joiningDate),
    employmentType: EMPLOYMENT_TYPES.includes(body.employmentType) ? body.employmentType : undefined,

    salesTarget: num(body.salesTarget),
    commissionPercentage: num(body.commissionPercentage),
    leadAssignmentRule: str(body.leadAssignmentRule),
    defaultPipelineId: body.defaultPipelineId || undefined,

    language: str(body.language),
    timezone: str(body.timezone),
    notificationPreferences: obj(body.notificationPreferences),
  };
}

function buildDisplayName(data) {
  const d = data.displayName?.trim();
  if (d) return d;
  const first = (data.firstName || "").trim();
  const last = (data.lastName || "").trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return data.name?.trim() || "";
}

/* ================= GET USER BY ID ================= */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid User ID" });
    }

    let query = { _id: id, isDeleted: { $ne: true } };
    if (req.user.role !== "super_admin") {
      query.companyId = req.user.companyId;
      if (req.user.role === "branch_manager") {
        query.$or = [{ branchId: req.user.branchId }, { primaryBranchId: req.user.branchId }, { additionalBranchIds: req.user.branchId }];
      }
    }

    const user = await User.findOne(query)
      .select("-password")
      .populate("branchId", "name branchCode")
      .populate("primaryBranchId", "name branchCode")
      .populate("additionalBranchIds", "name branchCode")
      .populate("reportingManagerId", "name email")
      .populate("defaultPipelineId", "name")
      .populate("companyId", "name");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("GET USER BY ID ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= CREATE USER ================= */
exports.createUser = async (req, res) => {
  try {
    const isCompanyAdmin = req.user.role === "company_admin";
    const isBranchManager = req.user.role === "branch_manager";
    if (!isCompanyAdmin && !isBranchManager) {
      return res.status(403).json({ message: "Access Denied" });
    }

    const raw = sanitizeUserBody(req.body);
    const isDraft = (raw.status || req.body.status) === "draft";
    const emailNorm = (raw.email || req.body.email || raw.workEmail || req.body.workEmail || "").trim().toLowerCase();
    if (!emailNorm) return res.status(400).json({ message: "Email is required" });

    const existingUser = await User.findOne({
      email: new RegExp(`^${emailNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      isDeleted: { $ne: true }
    });
    if (existingUser) return res.status(400).json({ message: "User with this email already exists" });

    const password = raw.password || req.body.password;
    if (!isDraft && (!password || String(password).trim().length < 6)) {
      return res.status(400).json({ message: "Password is required (min 6 characters)" });
    }
    const resolvedPassword = isDraft
      ? (password && String(password).trim().length >= 6 ? String(password).trim() : `${Date.now()}-${Math.random().toString(36).slice(2)}-draft`)
      : String(password).trim();
    const hashedPassword = await bcrypt.hash(resolvedPassword, 10);

    const targetBranchId = isBranchManager ? req.user.branchId : (raw.primaryBranchId || raw.branchId) || null;
    const targetRole = isBranchManager ? "sales" : (ROLES.includes(raw.role) ? raw.role : "sales");
    const name = buildDisplayName(raw) || raw.name || emailNorm.split("@")[0];
    const companyId = req.user.role === "super_admin" ? (raw.companyId || req.body.companyId) : req.user.companyId;
    if (!companyId) return res.status(400).json({ message: "Company is required" });

    const payload = {
      ...raw,
      name,
      email: emailNorm,
      password: hashedPassword,
      role: targetRole,
      companyId,
      branchId: targetBranchId,
      primaryBranchId: raw.primaryBranchId || targetBranchId,
      createdBy: req.user.id || req.user._id,
      updatedBy: req.user.id || req.user._id,
    };
    const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));

    const newUser = await User.create(clean);

    const populated = await User.findById(newUser._id)
      .select("-password")
      .populate("branchId", "name branchCode")
      .populate("primaryBranchId", "name branchCode")
      .populate("reportingManagerId", "name email")
      .populate("companyId", "name");

    res.status(201).json({ success: true, message: "User created successfully", data: populated });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET USERS ================= */
exports.getUsers = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not found in request" });
    }

    const { search, role, status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    let filter = { isDeleted: { $ne: true } };
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: "draft" };
    }

    if (search) {
      const s = String(search).trim();
      filter.$or = [
        { name: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { firstName: { $regex: s, $options: "i" } },
        { lastName: { $regex: s, $options: "i" } },
        { workEmail: { $regex: s, $options: "i" } },
        { employeeId: { $regex: s, $options: "i" } },
        { jobTitle: { $regex: s, $options: "i" } },
      ];
    }
    if (role) filter.role = role;

    if (req.user.role !== "super_admin") {
      filter.companyId = req.user.companyId;
      if (req.user.role === "branch_manager" && req.user.branchId) {
        filter.$or = [
          { branchId: req.user.branchId },
          { primaryBranchId: req.user.branchId },
          { additionalBranchIds: req.user.branchId }
        ];
      }
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limitNum)
        .populate("branchId", "name branchCode")
        .populate("primaryBranchId", "name branchCode")
        .populate("reportingManagerId", "name email")
    ]);

    res.json({
      success: true,
      data: users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET USER BY ID ================= */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    let query = { _id: id, isDeleted: { $ne: true } };
    if (req.user.role !== "super_admin") {
      query.companyId = req.user.companyId;
    }

    const user = await User.findOne(query).select("-password")
      .populate("branchId", "name branchCode")
      .populate("primaryBranchId", "name branchCode")
      .populate("companyId", "name");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("GET USER BY ID ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET ASSIGNABLE USERS ================= */
exports.getAssignableUsers = async (req, res) => {
  try {
    const { role: userRole, companyId, branchId, _id: userId } = req.user;

    let filter = {
      companyId,
      isDeleted: { $ne: true },
      status: "active"
    };

    if (userRole === "company_admin") {
      // All users in company (Branch Manager + Sales)
      filter.role = { $in: ["branch_manager", "sales"] };
    } else if (userRole === "branch_manager") {
      // Only sales users in same branch
      filter.role = "sales";
      filter.branchId = branchId;
    } else if (userRole === "sales") {
      // Only sales users in same branch
      filter.role = "sales";
      filter.branchId = branchId;
      // Note: Task 3 says "Can transfer only: To other sales users in same branch"
      // Task 5 says: "SALES: Only sales users in same branch"
    } else if (userRole === "super_admin") {
      // super admin can see everyone
    } else {
      // Default / restricted
      return res.json({ success: true, data: [] });
    }

    const users = await User.find(filter)
      .select("name email role branchId")
      .populate("branchId", "name")
      .sort({ name: 1 });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error("GET ASSIGNABLE USERS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE USER ================= */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid User ID format" });
    }

    let query = { _id: id, isDeleted: { $ne: true } };
    if (req.user.role !== "super_admin") {
      query.companyId = req.user.companyId;
      if (req.user.role === "branch_manager") {
        query.$or = [{ branchId: req.user.branchId }, { primaryBranchId: req.user.branchId }, { additionalBranchIds: req.user.branchId }];
      }
    }

    const existing = await User.findOne(query);
    if (!existing) return res.status(404).json({ success: false, message: "User not found" });

    const raw = sanitizeUserBody(req.body);
    const name = buildDisplayName(raw) || raw.name || existing.name;
    const updateData = { ...raw, name, updatedBy: req.user.id || req.user._id };

    if (req.body.password && String(req.body.password).trim()) {
      updateData.password = await bcrypt.hash(String(req.body.password).trim(), 10);
    } else {
      delete updateData.password;
    }

    if (updateData.primaryBranchId !== undefined) {
      updateData.branchId = updateData.primaryBranchId || updateData.branchId;
    }

    Object.assign(existing, updateData);
    await existing.save();

    const populated = await User.findById(existing._id)
      .select("-password")
      .populate("branchId", "name branchCode")
      .populate("primaryBranchId", "name branchCode")
      .populate("additionalBranchIds", "name branchCode")
      .populate("reportingManagerId", "name email")
      .populate("defaultPipelineId", "name")
      .populate("companyId", "name");

    res.json({ success: true, message: "User updated successfully", data: populated });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE USER (soft) ================= */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    if (req.user.role !== "company_admin" && req.user.role !== "branch_manager" && req.user.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Access Denied" });
    }

    let query = { _id: id, isDeleted: { $ne: true } };
    if (req.user.role !== "super_admin") {
      query.companyId = req.user.companyId;
      if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    }

    const user = await User.findOneAndUpdate(
      query,
      { isDeleted: true, updatedBy: req.user.id || req.user._id, status: "inactive" },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deactivated successfully", data: user });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE PUBLIC KEY & RECOVERY KEY (E2EE) ================= */
exports.updatePublicKey = async (req, res) => {
  try {
    const { publicKey, encryptedPrivateKey, privateKeyIv } = req.body;
    if (!publicKey) return res.status(400).json({ success: false, message: "Public key required" });

    const update = { publicKey };
    if (encryptedPrivateKey) update.encryptedPrivateKey = encryptedPrivateKey;
    if (privateKeyIv) update.privateKeyIv = privateKeyIv;

    await User.findByIdAndUpdate(req.user.id, update);
    
    res.json({ success: true, message: "Security keys updated successfully" });
  } catch (error) {
    console.error("UPDATE PUBLIC KEY ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET DIRECTORY (For Chat/Team) ================= */
exports.getDirectory = async (req, res) => {
  try {
    const users = await User.find({
      companyId: req.user.companyId,
      isDeleted: { $ne: true },
      _id: { $ne: req.user.id } // Exclude self
    })
    .select("name email role publicKey firstName lastName profilePhotoUrl status")
    .sort({ name: 1 });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error("GET DIRECTORY ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

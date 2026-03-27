const Company = require("../models/Company");
const User = require("../models/User");
const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const Branch = require("../models/Branch");
const Plan = require("../models/Plan");
const SystemLog = require("../models/SystemLog");
const bcrypt = require("bcryptjs");
const { seedMasterDataForCompany } = require("../utils/masterSeeder");
const { createDefaultPipeline } = require("./pipelineController");
const { getNextCustomId } = require("../utils/idGenerator");



/* ================= COMPANIES ================= */

// Get All Companies (Search & Pagination)
exports.getAllCompanies = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 100 } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { customId: { $regex: search, $options: "i" } }
      ];
    }


    const companies = await Company.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Company.countDocuments(query);

    res.json({
      success: true,
      data: companies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};

// Create Company + Auto Company Admin
exports.createCompany = async (req, res, next) => {
  try {
    console.log("🏙️ ONBOARDING COMPANY REQ:", JSON.stringify(req.body, null, 2));
    const { name, email, phone, website, industry, address, adminName, adminEmail, adminPassword } = req.body;

    const targetEmail = (adminEmail || email).toLowerCase();
    const companyEmail = email.toLowerCase();

    // A. Verify if target admin email already exists
    const existingAdminUser = await User.findOne({ email: targetEmail });
    if (existingAdminUser) {
      return res.status(400).json({
        success: false,
        message: `Administrative Login ID '${targetEmail}' is already registered as a ${existingAdminUser.role}. Please use a unique login email.`
      });
    }

    // B. Verify if company contact email already exists (if different)
    if (companyEmail !== targetEmail) {
        const existingContactUser = await User.findOne({ email: companyEmail });
        if (existingContactUser) {
            return res.status(400).json({
                success: false,
                message: `Company Email '${companyEmail}' is already linked to an existing account. Suggest choosing a dedicated login email.`
            });
        }
    }

    // B. Get or Create Demo Plan
    let demoPlan = await Plan.findOne({ name: "Demo", price: 0 });
    if (!demoPlan) {
      demoPlan = await Plan.create({
        name: "Demo",
        duration: 7,
        price: 0,
        features: ["Basic CRM access", "Limited leads", "Limited deals"],
        isActive: true
      });
    }

    // C. Create Company with Demo Plan
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + demoPlan.duration);

    const customId = await getNextCustomId({ module: "company", companyName: name });
    let companyCode = customId.split('-')[0];

    // Ensure companyCode is unique before creation
    let codeConflict = await Company.findOne({ code: companyCode });
    let suffix = 1;
    let baseCode = companyCode;
    while (codeConflict) {
      companyCode = `${baseCode}${suffix}`;
      codeConflict = await Company.findOne({ code: companyCode });
      suffix++;
    }

    const newCompany = await Company.create({
      name,
      email,
      phone,
      website,
      industry,
      address,
      planId: demoPlan._id,
      startDate,
      endDate,
      subscriptionStatus: "active",
      customId,
      code: companyCode
    });


    // D. Create Company Admin User
    const hashedPassword = await bcrypt.hash(adminPassword || "Company@123", 10);
    const newUser = await User.create({
      name: adminName || `${name} Admin`,
      email: targetEmail.toLowerCase(),
      password: hashedPassword,
      role: "company_admin",
      companyId: newCompany._id
    });

    // D. Seed default master data for the new company
    await seedMasterDataForCompany(newCompany._id, newUser._id);

    // E. Create default pipeline — ONE pipeline per company, guaranteed
    await createDefaultPipeline(newCompany._id, newUser._id);
    console.log("COMPANY CREATED:", newCompany._id, "with default pipeline.");

    res.status(201).json({
      success: true,
      message: "Company and Admin profile initialized successfully.",
      data: newCompany
    });
  } catch (error) {
    console.error("CREATE COMPANY ERROR:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({ 
        success: false, 
        message: `This ${field} is already in use. Please use a unique ${field}.` 
      });
    }
    next(error);
  }
};

// Update Company
exports.updateCompany = async (req, res, next) => {
  try {
    const updated = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Delete Company
exports.deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Company.findByIdAndDelete(id);
    await User.deleteMany({ companyId: id });
    await Branch.deleteMany({ companyId: id });
    res.json({ success: true, message: "Company and all associated data purged successfully" });
  } catch (error) {
    console.error("DELETE COMPANY ERROR:", error);
    next(error);
  }
};

/* ================= PLANS ================= */

// Get All Plans
exports.getAllPlans = async (req, res, next) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

// Create Plan
exports.createPlan = async (req, res, next) => {
  try {
    const newPlan = await Plan.create(req.body);
    res.status(201).json({ success: true, data: newPlan });
  } catch (error) {
    next(error);
  }
};

// Update Plan
exports.updatePlan = async (req, res, next) => {
  try {
    const updated = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Delete Plan
exports.deletePlan = async (req, res, next) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Plan deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Assign Plan to Company (Renewal/Manual Assignment)
exports.assignPlanToCompany = async (req, res, next) => {
  try {
    const { companyId, planId, startDate, customEndDate } = req.body;
    
    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    const sDate = startDate ? new Date(startDate) : new Date();
    let eDate;
    
    if (customEndDate) {
      eDate = new Date(customEndDate);
    } else {
      eDate = new Date(sDate);
      eDate.setDate(sDate.getDate() + plan.duration);
    }

    const updatedCompany = await Company.findByIdAndUpdate(companyId, {
      planId,
      startDate: sDate,
      endDate: eDate,
      subscriptionStatus: "active"
    }, { new: true });

    if (!updatedCompany) return res.status(404).json({ success: false, message: "Company not found" });

    res.json({ success: true, message: "Plan assigned successfully", data: updatedCompany });
  } catch (error) {
    next(error);
  }
};

/* ================= BRANCHES ================= */

exports.getAllBranches = async (req, res, next) => {
  try {
    const { search, companyId, page = 1, limit = 20, status } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    let query = { isDeleted: false };
    if (search) query.name = { $regex: search, $options: "i" };
    if (companyId) query.companyId = companyId;
    if (status && ["active", "inactive", "closed"].includes(status)) query.status = status;

    const [total, branches] = await Promise.all([
      Branch.countDocuments(query),
      Branch.find(query)
        .populate("companyId", "name")
        .populate("branchManagerId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    res.json({
      success: true,
      data: branches,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    next(error);
  }
};

exports.getBranchById = async (req, res, next) => {
  try {
    const branchController = require("./branchController");
    return branchController.getBranchById(req, res);
  } catch (error) {
    next(error);
  }
};

exports.createBranch = async (req, res, next) => {
  try {
    const branchController = require("./branchController");
    return branchController.createBranch(req, res);
  } catch (error) {
    next(error);
  }
};

exports.updateBranch = async (req, res, next) => {
  try {
    const branchController = require("./branchController");
    return branchController.updateBranch(req, res);
  } catch (error) {
    next(error);
  }
};

exports.deleteBranch = async (req, res, next) => {
  try {
    const branchController = require("./branchController");
    return branchController.deleteBranch(req, res);
  } catch (error) {
    next(error);
  }
};

/* ================= USERS ================= */

exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, companyId, branchId } = req.query;
    let query = { isDeleted: { $ne: true } };
    if (role) query.role = role;
    if (companyId) query.companyId = companyId;
    if (branchId) query.branchId = branchId;

    const users = await User.find(query)
      .populate("companyId", "name")
      .populate("branchId", "name")
      .populate("primaryBranchId", "name branchCode")
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .select("-password")
      .populate("companyId", "name")
      .populate("branchId", "name branchCode")
      .populate("primaryBranchId", "name branchCode")
      .populate("additionalBranchIds", "name branchCode")
      .populate("reportingManagerId", "name email")
      .populate("defaultPipelineId", "name");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { password, ...body } = req.body;
    const hashedPassword = await bcrypt.hash(password || "Change@123", 10);
    const name = body.displayName?.trim() || [body.firstName, body.lastName].filter(Boolean).join(" ").trim() || body.name || "User";
    const newUser = await User.create({ ...body, name, password: hashedPassword });
    const populated = await User.findById(newUser._id).select("-password")
      .populate("companyId", "name").populate("branchId", "name").populate("primaryBranchId", "name");
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (update.password && update.password.trim()) {
      update.password = await bcrypt.hash(update.password, 10);
    } else {
      delete update.password;
    }
    const name = update.displayName?.trim() || [update.firstName, update.lastName].filter(Boolean).join(" ").trim() || update.name;
    if (name) update.name = name;
    const updated = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password")
      .populate("companyId", "name").populate("branchId", "name").populate("primaryBranchId", "name")
      .populate("reportingManagerId", "name email");
    if (!updated) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, status: "inactive", updatedBy: req.user?.id || req.user?._id },
      { new: true }
    ).select("-password");
    if (!updated) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deactivated successfully", data: updated });
  } catch (error) {
    next(error);
  }
};

/* ================= LEADS ================= */

exports.getAllLeads = async (req, res, next) => {
  try {
    const { companyId, status, search } = req.query;
    let query = {};
    if (companyId) query.companyId = companyId;
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: "i" };

    const leads = await Lead.find(query)
      .populate("companyId", "name")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: leads });
  } catch (error) {
    next(error);
  }
};

exports.deleteLead = async (req, res, next) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Lead Purged Successfully" });
  } catch (error) {
    next(error);
  }
};

/* ================= DEALS ================= */

exports.getAllDeals = async (req, res, next) => {
  try {
    const { companyId, stage } = req.query;
    let query = {};
    if (companyId) query.companyId = companyId;
    if (stage) query.stage = stage;

    const deals = await Deal.find(query)
      .populate("companyId", "name")
      .populate("leadId", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: deals });
  } catch (error) {
    next(error);
  }
};

exports.updateDeal = async (req, res, next) => {
  try {
    const updated = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteDeal = async (req, res, next) => {
  try {
    await Deal.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deal Purged Successfully" });
  } catch (error) {
    next(error);
  }
};

/* ================= STATS (legacy – company/CRM scoped; prefer getPlatformStats for super_admin) ================= */

exports.getStats = async (req, res, next) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalBranches = await Branch.countDocuments();
    const recentCompanies = await Company.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        totalCompanies,
        totalBranches,
        totalUsers,
        recentCompanies: recentCompanies.map((c) => ({ _id: c._id, name: c.name, createdAt: c.createdAt }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/* ================= PLATFORM STATS (Super Admin only – no CRM/sales data) ================= */

exports.getPlatformStats = async (req, res, next) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const activeCompanies = await Company.countDocuments({ status: "active" });
    const trialCompanies = await Company.countDocuments({ status: "trial" }).catch(() => 0);
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: "active" }).catch(() => totalUsers);

    const recentCompanies = await Company.find().sort({ createdAt: -1 }).limit(5).select("name createdAt status");

    res.json({
      success: true,
      data: {
        totalCompanies,
        activeCompanies: activeCompanies ?? totalCompanies,
        trialCompanies: trialCompanies ?? 0,
        totalUsers,
        activeUsers: activeUsers ?? totalUsers,
        platformMonthlyRevenue: 0,
        subscriptionPlansCount: 0,
        serverHealth: "healthy",
        apiUsage: 0,
        storageUsage: "0 MB",
        recentCompanies
      }
    });
  } catch (error) {
    next(error);
  }
};

/* ================= SYSTEM LOGS ================= */

exports.getSystemLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const logs = await SystemLog.find()
      .populate("userId", "name email")
      .populate("companyId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit * 1);

    const total = await SystemLog.countDocuments();

    res.json({
      success: true,
      data: logs,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};
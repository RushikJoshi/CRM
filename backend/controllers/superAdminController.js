const Company = require("../models/Company");
const User = require("../models/User");
const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const Branch = require("../models/Branch");
const bcrypt = require("bcryptjs");
const { seedMasterDataForCompany } = require("../utils/masterSeeder");

/* ================= COMPANIES ================= */

// Get All Companies (Search & Pagination)
exports.getAllCompanies = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const companies = await Company.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Company.countDocuments(query);

    res.json({
      companies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Company + Auto Company Admin
exports.createCompany = async (req, res) => {
  try {
    const { name, email, phone, website, industry, address, adminName, adminEmail, adminPassword } = req.body;

    // 1. Create Company
    const newCompany = await Company.create({ name, email, phone, website, industry, address });

    // 2. Create Company Admin User
    const hashedPassword = await bcrypt.hash(adminPassword || "Company@123", 10);
    await User.create({
      name: adminName || `${name} Admin`,
      email: adminEmail || email,
      password: hashedPassword,
      role: "company_admin",
      companyId: newCompany._id
    });

    // Seed default master data for the new company
    await seedMasterDataForCompany(newCompany._id, newUser._id);

    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Company
exports.updateCompany = async (req, res) => {
  try {
    const updated = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Company
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    await Company.findByIdAndDelete(id);
    await User.deleteMany({ companyId: id });
    await Branch.deleteMany({ companyId: id });
    res.json({ message: "Company Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= BRANCHES ================= */

exports.getAllBranches = async (req, res) => {
  try {
    const { search, companyId } = req.query;
    let query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (companyId) query.companyId = companyId;

    const branches = await Branch.find(query).populate("companyId", "name");
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createBranch = async (req, res) => {
  try {
    const newBranch = await Branch.create(req.body);
    res.status(201).json(newBranch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const updated = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    await Branch.findByIdAndDelete(req.params.id);
    res.json({ message: "Branch Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= USERS ================= */

exports.getAllUsers = async (req, res) => {
  try {
    const { role, companyId, branchId } = req.query;
    let query = {};
    if (role) query.role = role;
    if (companyId) query.companyId = companyId;
    if (branchId) query.branchId = branchId;

    const users = await User.find(query)
      .populate("companyId", "name")
      .populate("branchId", "name")
      .select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { password, ...body } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ ...body, password: hashedPassword });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= LEADS ================= */

exports.getAllLeads = async (req, res) => {
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
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: "Lead Purged Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= DEALS ================= */

exports.getAllDeals = async (req, res) => {
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
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDeal = async (req, res) => {
  try {
    const updated = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDeal = async (req, res) => {
  try {
    await Deal.findByIdAndDelete(req.params.id);
    res.json({ message: "Deal Purged Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= STATS ================= */

exports.getStats = async (req, res) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalLeads = await Lead.countDocuments();
    const totalDeals = await Deal.countDocuments();
    const totalBranches = await Branch.countDocuments();

    const revenueData = await Deal.aggregate([
      { $match: { stage: "closed_won" } },
      { $group: { _id: null, totalRevenue: { $sum: "$value" } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    const recentCompanies = await Company.find().sort({ createdAt: -1 }).limit(5);
    const recentDeals = await Deal.find().populate('companyId').sort({ createdAt: -1 }).limit(5);
    const recentLeads = await Lead.find().populate('companyId').sort({ createdAt: -1 }).limit(5);

    const recentActivities = [
      ...recentCompanies.map(c => ({ type: 'company', text: `Added Company: ${c.name}`, time: c.createdAt })),
      ...recentDeals.map(d => ({ type: 'deal', text: `New Deal: ${d.title} (₹${Number(d.value).toLocaleString('en-IN')})`, time: d.createdAt })),
      ...recentLeads.map(l => ({ type: 'lead', text: `New Lead: ${l.name}`, time: l.createdAt }))
    ].sort((a, b) => b.time - a.time).slice(0, 10);

    const dealsByStage = await Deal.aggregate([
      { $group: { _id: "$stage", count: { $sum: 1 } } }
    ]);

    const leadsByStatus = await Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const totalInquiries = await require("../models/Inquiry").countDocuments();
    const totalCustomers = await require("../models/Customer").countDocuments({ isDeleted: { $ne: true } });
    const totalContacts = await require("../models/Contact").countDocuments();
    const conversionRate = totalLeads > 0 ? ((totalDeals / totalLeads) * 100).toFixed(1) : 0;

    const futureLimit = new Date();
    futureLimit.setHours(futureLimit.getHours() + 48);
    const now = new Date();

    const [calls, meetings] = await Promise.all([
      require("../models/Call").find({ status: 'Scheduled', startDate: { $gte: now, $lte: futureLimit } }).sort({ startDate: 1 }).limit(10).populate("assignedTo", "name"),
      require("../models/Meeting").find({ startDate: { $gte: now, $lte: futureLimit } }).sort({ startDate: 1 }).limit(10).populate("assignedTo", "name"),
    ]);

    const upcomingAgenda = [
      ...calls.map(c => ({ title: c.title, date: c.startDate, type: 'call', assignedTo: c.assignedTo?.name })),
      ...meetings.map(m => ({ title: m.title, date: m.startDate, type: 'meeting', assignedTo: m.assignedTo?.name }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      totalCompanies, totalBranches, totalUsers, totalLeads, totalDeals, totalRevenue,
      totalInquiries, totalCustomers, totalContacts, conversionRate,
      recentActivities, recentLeads, recentDeals, dealsByStage, leadsByStatus,
      upcomingAgenda
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
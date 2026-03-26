const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const Customer = require("../models/Customer");
const Contact = require("../models/Contact");
const Call = require("../models/Call");
const Meeting = require("../models/Meeting");
const Todo = require("../models/Todo");
const User = require("../models/User");

exports.getDashboardStats = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { companyId, branchId, role, id: userId } = req.user;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const now = new Date();

    // Helper for safe ObjectId casting in Aggregations
    const toObjectId = (id) => {
      try {
        return id ? new mongoose.Types.ObjectId(String(id)) : null;
      } catch (e) {
        return null;
      }
    };

    // Dynamic Filter
    let filter = { isDeleted: false };
    if (role !== "super_admin") {
      if (companyId) filter.companyId = companyId;
      if (role === "branch_manager" && branchId) filter.branchId = branchId;
      else if (role === "sales") filter.assignedTo = userId;
    }

    // Deal Filter 
    let dealFilter = {};
    if (role !== "super_admin") {
      if (companyId) dealFilter.companyId = companyId;
      if (role === "branch_manager" && branchId) dealFilter.branchId = branchId;
      else if (role === "sales") dealFilter.assignedTo = userId;
    }

    // Aggression-specific IDs (Aggregations need manual casting)
    const companyOid = toObjectId(companyId);
    const branchOid = toObjectId(branchId);
    const userOid = toObjectId(userId);

    // Build specific filter for Aggregations (which don't auto-cast)
    let aggDealFilter = {};
    if (role !== "super_admin") {
      if (companyOid) aggDealFilter.companyId = companyOid;
      if (role === "branch_manager" && branchOid) aggDealFilter.branchId = branchOid;
      else if (role === "sales" && userOid) aggDealFilter.assignedTo = userOid;
    }

    // Fetch All Stats in Parallel
    const [
      totalLeads,
      totalQualifiedLeads,
      totalDeals,
      totalCustomers,
      totalContacts,
      todayCalls,
      todayMeetings,
      todayTasks,
      revenueData,
      dealsByStage,
      recentLeads,
      recentDeals,
      totalInquiries,
      recentInquiries,
      hotLeads,
      overdueTasks,
      agingLeads,
      dealsWon,
      activeUsers,
      totalUsers,
      performanceLeaderboard
    ] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.countDocuments({ ...filter, status: /qualified/i }),
      Deal.countDocuments(dealFilter),
      Customer.countDocuments({
        ...filter,
        isDeleted: { $ne: true }
      }),
      Contact.countDocuments(filter),
      Call.countDocuments({
        ...filter,
        startDate: { $gte: todayStart, $lte: todayEnd }
      }),
      Meeting.countDocuments({
        ...filter,
        startDate: { $gte: todayStart, $lte: todayEnd }
      }),
      Todo.countDocuments({
        ...filter,
        status: { $ne: "Completed" },
        dueDate: { $gte: todayStart, $lte: todayEnd }
      }),
      Deal.aggregate([
        { $match: { ...aggDealFilter, stage: "Closed Won" } },
        { $group: { _id: null, totalRevenue: { $sum: "$value" } } }
      ]),
      Deal.aggregate([
        { $match: aggDealFilter },
        { $group: { _id: "$stage", count: { $sum: 1 } } }
      ]),
      Lead.find(filter).sort({ createdAt: -1 }).limit(5).populate("assignedTo", "name"),
      Deal.find(dealFilter).sort({ createdAt: -1 }).limit(5).populate("assignedTo", "name"),
      (() => {
        let inquiryFilter = { companyId };
        if (role === "branch_manager") inquiryFilter.branchId = branchId;
        if (role === "sales") inquiryFilter.assignedTo = userId;
        return require("../models/Inquiry").countDocuments(inquiryFilter);
      })(),
      (() => {
        let inquiryFilter = { companyId };
        if (role === "branch_manager") inquiryFilter.branchId = branchId;
        if (role === "sales") inquiryFilter.assignedTo = userId;
        return require("../models/Inquiry").find(inquiryFilter).sort({ createdAt: -1 }).limit(5).populate("assignedTo", "name");
      })(),
      Lead.find({ ...filter, score: { $gte: 60 } }).sort({ score: -1 }).limit(5).populate("assignedTo", "name"),
      Todo.countDocuments({
        ...filter,
        status: { $ne: "Completed" },
        dueDate: { $lt: now }
      }),
      // Lead Aging: Leads not updated in 3 days
      Lead.countDocuments({
        ...filter,
        status: { $nin: ["Closed Won", "Closed Lost", "Won", "Lost"] },
        updatedAt: { $lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      }),
      // Funnel Stage: Deals Won
      Deal.countDocuments({ ...dealFilter, stage: { $in: ["Won", "Closed Won"] } }),
      // Active Users Count
      User.countDocuments({
        companyId,
        status: "active",
        isDeleted: { $ne: true },
        ...(role === "branch_manager" ? { branchId } : {})
      }),
      // Total Users Count (company-level; branch managers scoped to branch)
      User.countDocuments({
        companyId,
        isDeleted: { $ne: true },
        ...(role === "branch_manager" ? { branchId } : {})
      }),
      // Performance Leaderboard (Rank users by revenue/deals)
      (role === "company_admin" || role === "branch_manager") ? Deal.aggregate([
        { $match: { companyId: companyOid, stage: { $in: ["Won", "Closed Won"] } } },
        {
          $group: {
            _id: "$assignedTo",
            dealsWon: { $sum: 1 },
            totalRevenue: { $sum: "$value" }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userDetails"
          }
        },
        { $unwind: "$userDetails" },
        {
          $project: {
            name: "$userDetails.name",
            dealsWon: 1,
            totalRevenue: 1
          }
        }
      ]) : Promise.resolve([])
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const conversionRate = totalLeads > 0 ? ((totalDeals / totalLeads) * 100).toFixed(1) : 0;

    // Agenda / Recent Activities
    const futureLimit = new Date();
    futureLimit.setHours(futureLimit.getHours() + 48); // 48 hour lookahead

    let activityFilter = { companyId };
    if (role === "branch_manager") activityFilter.branchId = branchId;
    if (role === "sales") activityFilter.assignedTo = userId;

    let recentActivities = [];
    let upcomingAgenda = [];
    try {
      const [calls, meetings, tasks] = await Promise.all([
        Call.find({ ...activityFilter, status: 'Scheduled', startDate: { $gte: now } }).sort({ startDate: 1 }).limit(10).populate("assignedTo", "name"),
        Meeting.find({ ...activityFilter, startDate: { $gte: now } }).sort({ startDate: 1 }).limit(10).populate("assignedTo", "name"),
        Todo.find({ ...activityFilter, status: { $ne: 'Completed' }, dueDate: { $get: now } }).sort({ dueDate: 1 }).limit(5)
      ]);

      recentActivities = [
        ...calls.map(c => ({ type: 'call', text: `Call: ${c.title}`, time: c.startDate, id: c._id })),
        ...meetings.map(m => ({ type: 'meeting', text: `Meeting: ${m.title}`, time: m.startDate, id: m._id })),
        ...tasks.map(t => ({ type: 'task', text: `Task: ${t.title}`, time: t.dueDate, id: t._id }))
      ].sort((a, b) => new Date(a.time) - new Date(b.time)).slice(0, 10);

      upcomingAgenda = [
        ...calls.filter(c => c.startDate <= futureLimit).map(c => ({ title: c.title, date: c.startDate, type: 'call', assignedTo: c.assignedTo?.name })),
        ...meetings.filter(m => m.startDate <= futureLimit).map(m => ({ title: m.title, date: m.startDate, type: 'meeting', assignedTo: m.assignedTo?.name }))
      ].sort((a, b) => new Date(a.date) - new Date(b.date));

    } catch (actErr) {
      console.error("Activity fetch error:", actErr);
    }

    res.json({
      success: true,
      data: {
        totalLeads,
        totalDeals,
        totalCustomers,
        totalContacts,
        todayCalls,
        todayMeetings,
        todayTasks,
        totalRevenue,
        conversionRate,
        dealsByStage,
        recentActivities,
        upcomingAgenda,
        recentLeads,
        recentDeals,
        totalInquiries,
        recentInquiries,
        totalProspects: totalQualifiedLeads,
        hotLeads,
        overdueTasks,
        agingLeads,
        dealsWon,
        activeUsers,
        totalUsers,
        performanceLeaderboard,
        funnel: [
          { label: "Inquiries", count: totalInquiries || 0, color: "bg-blue-500" },
          { label: "Leads", count: totalLeads || 0, color: "bg-emerald-500" },
          { label: "Prospects", count: totalQualifiedLeads || 0, color: "bg-amber-500" },
          { label: "Deals", count: totalDeals || 0, color: "bg-indigo-500" },
          { label: "Won", count: dealsWon || 0, color: "bg-green-600" }
        ]
      }
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET DASHBOARD LEADS STATS ─────────────────────────────────────────────────
exports.getLeadsStats = async (req, res) => {
  try {
    const { companyId, branchId, role, id: userId } = req.user;
    let filter = { isDeleted: false, companyId };
    if (role === "branch_manager" && branchId) filter.branchId = branchId;
    else if (role === "sales") filter.assignedTo = userId;

    const totalLeads = await Lead.countDocuments(filter);
    const newLeads = await Lead.countDocuments({ ...filter, status: "New" });
    const hotLeads = await Lead.countDocuments({ ...filter, priority: "high" });

    res.json({ success: true, data: { totalLeads, newLeads, hotLeads } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET DASHBOARD DEALS STATS ─────────────────────────────────────────────────
exports.getDealsStats = async (req, res) => {
  try {
    const { companyId, branchId, role, id: userId } = req.user;
    let filter = { companyId };
    if (role === "branch_manager" && branchId) filter.branchId = branchId;
    else if (role === "sales") filter.assignedTo = userId;

    const totalDeals = await Deal.countDocuments(filter);
    const dealsWon = await Deal.countDocuments({ ...filter, stage: { $in: ["Won", "Closed Won"] } });
    const dealsLost = await Deal.countDocuments({ ...filter, stage: { $in: ["Lost", "Closed Lost"] } });

    res.json({ success: true, data: { totalDeals, dealsWon, dealsLost } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET DASHBOARD CONVERSION STATS ──────────────────────────────────────────────
exports.getConversionStats = async (req, res) => {
  try {
    const { companyId, branchId, role, id: userId } = req.user;
    let inquiryFilter = { companyId };
    let leadFilter = { isDeleted: false, companyId };

    if (role === "branch_manager" && branchId) {
      inquiryFilter.branchId = branchId;
      leadFilter.branchId = branchId;
    } else if (role === "sales") {
      inquiryFilter.branchId = branchId; // Sales can't easily filter by assignedTo on Inquiries yet
      leadFilter.assignedTo = userId;
    }

    const InquiryConfig = require("../models/Inquiry");
    const totalInquiries = await InquiryConfig.countDocuments(inquiryFilter);
    const totalLeads = await Lead.countDocuments(leadFilter);

    const conversionRate = totalInquiries > 0 ? ((totalLeads / totalInquiries) * 100).toFixed(1) : 0;

    res.json({ success: true, data: { totalInquiries, totalLeads, conversionRate: parseFloat(conversionRate) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
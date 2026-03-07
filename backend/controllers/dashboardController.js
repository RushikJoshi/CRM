const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const Customer = require("../models/Customer");
const Contact = require("../models/Contact");
const Call = require("../models/Call");
const Meeting = require("../models/Meeting");
const Todo = require("../models/Todo");

exports.getDashboardStats = async (req, res) => {
  try {
    const { companyId, branchId, role, id: userId } = req.user;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

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

    // Fetch All Stats in Parallel
    const [
      totalLeads,
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
      hotLeads
    ] = await Promise.all([
      Lead.countDocuments(filter),
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
        dueDate: { $gte: todayStart, $lte: todayEnd }
      }),
      Deal.aggregate([
        { $match: { ...dealFilter, stage: "Closed Won" } },
        { $group: { _id: null, totalRevenue: { $sum: "$value" } } }
      ]),
      Deal.aggregate([
        { $match: dealFilter },
        { $group: { _id: "$stage", count: { $sum: 1 } } }
      ]),
      Lead.find(filter).sort({ createdAt: -1 }).limit(5).populate("assignedTo", "name"),
      Deal.find(dealFilter).sort({ createdAt: -1 }).limit(5).populate("assignedTo", "name"),
      (() => {
        let inquiryFilter = {};
        if (role !== "super_admin") {
          inquiryFilter.companyId = companyId;
          if (role === "branch_manager" || role === "sales") {
            if (branchId) inquiryFilter.branchId = branchId;
          }
        }
        return require("../models/Inquiry").countDocuments(inquiryFilter);
      })(),
      Lead.find({ ...filter, score: { $gte: 60 } }).sort({ score: -1 }).limit(5).populate("assignedTo", "name")
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const conversionRate = totalLeads > 0 ? ((totalDeals / totalLeads) * 100).toFixed(1) : 0;

    // Agenda / Recent Activities
    const now = new Date();
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
        Todo.find({ ...activityFilter, status: { $ne: 'Completed' }, dueDate: { $gte: now } }).sort({ dueDate: 1 }).limit(5)
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
      hotLeads
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: error.message });
  }
};
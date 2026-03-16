const AuditLog = require("../models/AuditLog");

/**
 * GET /api/audit-logs
 * Tenant-isolated: company_admin/branch_manager/sales see only their company (and branch for branch_manager).
 * Super Admin can pass ?companyId= to filter or omit to see platform-wide.
 */
exports.getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, objectType, companyId: queryCompanyId, startDate, endDate } = req.query;
        const { role, companyId: userCompanyId } = req.user;

        let filter = {};

        if (role === "super_admin") {
            if (queryCompanyId) filter.companyId = queryCompanyId;
        } else {
            filter.companyId = userCompanyId;
            if (req.user.role === "branch_manager" && req.user.branchId) {
                filter.branchId = req.user.branchId;
            }
        }

        if (objectType) filter.objectType = objectType;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("userId", "name email")
                .lean(),
            AuditLog.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: logs,
            pagination: {
                page: Math.floor(skip / limitNum) + 1,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error("GET AUDIT LOGS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

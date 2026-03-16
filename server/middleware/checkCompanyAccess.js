module.exports = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { role, companyId, branchId, id } = req.user;

    // Super Admin can access everything
    if (role === "super_admin") {
        return next();
    }

    // If the request is for a specific company/resource, we should check it
    // This middleware assumes that controllers will use req.user.companyId
    // but we can also check if req.params.companyId matches if present.

    const targetCompanyId = req.params?.companyId || req.body?.companyId || req.query?.companyId;

    if (targetCompanyId && String(targetCompanyId) !== String(companyId)) {
        return res.status(403).json({ message: "Forbidden: Cross-company access denied" });
    }

    // Branch Manager isolation (if branchId is relevant for the route)
    const targetBranchId = req.params?.branchId || req.body?.branchId || req.query?.branchId;
    if (role === "branch_manager" && targetBranchId && String(targetBranchId) !== String(branchId)) {
        return res.status(403).json({ message: "Forbidden: Cross-branch access denied" });
    }

    next();
};

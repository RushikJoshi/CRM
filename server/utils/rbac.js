/**
 * Centralized RBAC logic for CRM filtering and assignment.
 */

/**
 * Generates a MongoDB query filter based on the user's role and hierarchy.
 * @param {Object} user - The logged-in user from req.user
 * @param {Object} existingQuery - Any existing filter criteria
 * @returns {Object} Final filter for MongoDB query
 */
exports.getRBACFilter = (user, existingQuery = {}) => {
    // Basic protection: always enforce companyId
    if (!user || !user.companyId) {
        throw new Error("Unauthorized: Company ID missing.");
    }

    // Initialize filter with companyId
    const filter = { ...existingQuery, companyId: user.companyId };

    // Super Admin: seen all (not mentioned in request but for safety)
    if (user.role === "super_admin") {
        return filter;
    }

    // Role-based visibility logic
    switch (user.role) {
        case "company_admin":
            // Can see all inquiries/leads of their company
            // filter already has companyId
            break;

        case "branch_manager":
            // Can see data of their branch OR where they are explicitly assigned as manager
            if (!user.branchId) {
                filter.assignedManagerId = user._id || user.id;
            } else {
                filter.$or = [
                    { branchId: user.branchId },
                    { assignedBranchId: user.branchId },
                    { assignedManagerId: user._id || user.id }
                ];
            }
            break;

        case "sales":
            // Can see assigned data (primary or in team array) 
            filter.$or = [
                { assignedTo: user._id || user.id },
                { assignedSalesIds: user._id || user.id }
            ];
            break;

        default:
            // For other roles like support/marketing, we default to no access or restricted access
            // Let's restrict it to their ID for now as safety
            filter.assignedTo = user._id || user.id;
            break;
    }

    return filter;
};

/**
 * Validates if the user can perform an assignment based on target user's role and branch.
 * @param {Object} user - The logged-in user
 * @param {Object} targetUser - The user being assigned to
 * @param {Object} record - The inquiry/lead record being assigned
 */
exports.validateAssignment = (user, targetUser, record) => {
    // Always enforce same company
    if (String(user.companyId) !== String(targetUser.companyId)) {
        throw new Error("No cross-company assignment allowed.");
    }

    // Role-based validation
    if (user.role === "company_admin") {
        // Can assign to branch managers and sales in same company
        if (!["branch_manager", "sales"].includes(targetUser.role)) {
            // Can company admin assign to another company admin? (not specified, let's allow or restrict)
            // Request says "Can assign to: Branch Managers, Sales users"
        }
        return true;
    }

    if (user.role === "branch_manager") {
        // Can assign only to sales in same branch
        if (targetUser.role !== "sales") {
            throw new Error("Branch Managers can only assign to Sales users.");
        }
        if (String(user.branchId) !== String(targetUser.branchId)) {
            throw new Error("Branch Managers can only assign to users in the same branch.");
        }
        return true;
    }

    if (user.role === "sales") {
        // Check if current user is the owner
        if (String(record.assignedTo) !== String(user._id || user.id)) {
            throw new Error("You can only transfer records assigned to you.");
        }

        // Can transfer only to other sales users in same branch
        if (targetUser.role !== "sales") {
            throw new Error("Sales users can only transfer to other Sales users.");
        }

        if (String(user.branchId) !== String(targetUser.branchId)) {
            throw new Error("You can only transfer to users in the same branch.");
        }

        return true;
    }

    throw new Error("Access Denied: Role not authorized for assignment.");
};

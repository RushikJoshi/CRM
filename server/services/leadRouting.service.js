const Branch = require("../models/Branch");
const User = require("../models/User");
const mongoose = require("mongoose");

/**
 * Lead Routing Engine
 * Maps a CityId to a Branch -> Manager -> Sales Team
 */
class LeadRoutingService {
    /**
     * Route a lead based on cityId and companyId
     */
    async routeLead(cityId, companyId) {
        try {
            // 1. Find Branch serving this city in this company
            const branch = await Branch.findOne({ 
                cityId, 
                companyId, 
                isDeleted: false,
                status: "active"
            }).populate("branchManagerId");

            if (!branch) {
                console.log(`[Routing] No branch found for city ${cityId} in company ${companyId}. Falling back to Company Admin.`);
                return await this.getFallbackAssignment(companyId);
            }

            // 2. Identify Role-Based Assignments
            const assignedBranchId = branch._id;
            const assignedManagerId = branch.branchManagerId?._id || branch.branchManagerId;

            // 3. Selection of Sales User (Round Robin)
            const salesUser = await this.getRoundRobinSalesUser(assignedBranchId, companyId);
            
            const assignedSalesIds = salesUser ? [salesUser._id] : [];
            const primaryAssignedTo = salesUser ? salesUser._id : (assignedManagerId || null);

            return {
                assignedBranchId,
                assignedManagerId,
                assignedSalesIds,
                assignedTo: primaryAssignedTo, // For backward compatibility/legacy assignedTo
                status: primaryAssignedTo ? "assigned" : "unassigned" 
            };

        } catch (error) {
            console.error("[Routing Engine Error]:", error);
            // On catastrophic failure, try fallback or return unassigned
            try {
                return await this.getFallbackAssignment(companyId);
            } catch (fallbackError) {
                return { status: "unassigned" };
            }
        }
    }

    /**
     * Round Robin selection for Sales users in a specific branch
     */
    async getRoundRobinSalesUser(branchId, companyId) {
        // Find users with role 'sales' in this branch, not deleted, active
        // Sort by lastAssignedAt ascending to pick the one who hasn't received a lead for the longest time
        const salesUser = await User.findOne({
            companyId,
            $or: [
                { branchId: branchId },
                { primaryBranchId: branchId },
                { additionalBranchIds: branchId }
            ],
            role: "sales",
            status: "active",
            isDeleted: false
        }).sort({ lastAssignedAt: 1 });

        if (salesUser) {
            // Update lastAssignedAt to move them to the end of the line
            salesUser.lastAssignedAt = new Date();
            await salesUser.save();
        }

        return salesUser;
    }

    /**
     * Fallback to Company Admin if no city-branch match is found
     */
    async getFallbackAssignment(companyId) {
        const admin = await User.findOne({
            companyId,
            role: "company_admin",
            status: "active",
            isDeleted: false
        }).sort({ lastAssignedAt: 1 });

        if (admin) {
            admin.lastAssignedAt = new Date();
            await admin.save();
            
            return {
                assignedBranchId: admin.branchId || null,
                assignedManagerId: admin._id,
                assignedSalesIds: [],
                assignedTo: admin._id,
                status: "assigned"
            };
        }

        return { status: "unassigned" };
    }
}

module.exports = new LeadRoutingService();

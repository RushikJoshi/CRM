const Company = require("../models/Company");

module.exports = async (req, res, next) => {
  try {
    // 1. Skip check for Super Admin or routes that don't need it (auth, public)
    // Also skip if no user is present (should be handled by auth middleware first)
    if (!req.user || req.user.role === "super_admin") {
      return next();
    }

    // If it's a login route or similar, we might want to skip, 
    // but usually this middleware is placed AFTER auth middleware on internal routes.
    
    if (!req.user.companyId) {
      return next();
    }

    // 2. Fetch Company Subscription Details
    // We use a simple cache or just DB hit for now.
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    // 3. Check for Expiration
    const now = new Date();
    if (company.endDate && new Date(company.endDate) < now) {
      // Update status if it's not already expired
      if (company.subscriptionStatus !== "expired") {
        company.subscriptionStatus = "expired";
        await company.save();
      }
      
      return res.status(403).json({ 
        success: false, 
        message: "Plan expired",
        isExpired: true,
        endDate: company.endDate
      });
    }

    // 4. Ensure status is active if not expired
    if (company.subscriptionStatus === "expired" && company.endDate && new Date(company.endDate) > now) {
        company.subscriptionStatus = "active";
        await company.save();
    }

    // All good
    next();
  } catch (error) {
    console.error("SUBSCRIPTION CHECK ERROR:", error.message);
    // On error, we might want to allow access to avoid blocking users due to DB hiccups, 
    // or block it for security. Let's allow for now but log.
    next();
  }
};

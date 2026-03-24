const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; // Contains id, role, companyId, branchId

        // Auto-apply subscription check if companyId is present
        if (req.user.companyId && req.user.role !== "super_admin") {
            const subscriptionCheck = require("./subscriptionCheck");
            return subscriptionCheck(req, res, next);
        }

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

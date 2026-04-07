const jwt = require("jsonwebtoken");

/**
 * 🔐 Server-side Middleware to Verify the SSO JWT cookie
 * MUST remain as CommonJS to be compatible with your Express server.
 */
const verifySSO = (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Populate req.user for the endpoint to return it
        }
        next();
    } catch (err) {
        // Silently continue; the endpoint will just see an undefined req.user
        next();
    }
};

module.exports = { verifySSO };
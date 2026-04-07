const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authController = require("../controllers/authController");
const { verifySSO } = require("../middleware/verifySSO");

// Public routes
router.post("/register-company", authController.registerCompany);
router.post("/login", authController.login);
// 🔥 SSO Check (NEW - safe, no conflict)
router.get("/sso/me", verifySSO, (req, res) => {
    console.log("SSO CHECK - User:", req.user?.userId, "Role:", req.user?.role);
    console.log("SSO CHECK - Cookie Token Found:", !!req.cookies.token);
    res.json({
        user: req.user,
        token: req.cookies.token
    });
});
// ── Self-service: any authenticated user can get/update their own profile ──────
router.get("/me", auth, authController.getMe);
router.put("/me/profile", auth, authController.updateProfile);
router.put("/me/password", auth, authController.changePassword);

module.exports = router;

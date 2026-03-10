const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authController = require("../controllers/authController");

// Public routes
router.post("/register-company", authController.registerCompany);
router.post("/login", authController.login);

// ── Self-service: any authenticated user can get/update their own profile ──────
router.get("/me", auth, authController.getMe);
router.put("/me/profile", auth, authController.updateProfile);
router.put("/me/password", auth, authController.changePassword);

module.exports = router;

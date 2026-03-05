const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// Register company
router.post("/register-company", authController.registerCompany);

// Login
router.post("/login", authController.login);
// router.post("/create-super-admin", authController.createSuperAdmin);

module.exports = router;

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const { createUser, getUsers, updateUser, deleteUser } = require("../controllers/userController");

router.post("/", auth, requireRole("super_admin", "company_admin", "branch_manager"), checkCompanyAccess, createUser);
router.get("/", auth, requireRole("super_admin", "company_admin", "branch_manager"), checkCompanyAccess, getUsers);
router.put("/:id", auth, requireRole("super_admin", "company_admin", "branch_manager"), checkCompanyAccess, updateUser);
router.delete("/:id", auth, requireRole("super_admin", "company_admin", "branch_manager"), checkCompanyAccess, deleteUser);

module.exports = router;
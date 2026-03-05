const User = require("../models/User");
const bcrypt = require("bcryptjs");

/* ================= CREATE USER ================= */
exports.createUser = async (req, res) => {
  try {

    // Only company_admin and branch_manager can create users
    const isCompanyAdmin = req.user.role === "company_admin";
    const isBranchManager = req.user.role === "branch_manager";

    if (!isCompanyAdmin && !isBranchManager) {
      return res.status(403).json({ message: "Access Denied" });
    }

    const { name, email, password, role, branchId } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Security enforcement
    const targetBranchId = isBranchManager ? req.user.branchId : branchId || null;
    const targetRole = isBranchManager ? "sales" : role;

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: targetRole,
      companyId: req.user.companyId,
      branchId: targetBranchId
    });

    res.json({
      message: "User Created Successfully",
      user: newUser
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/* ================= GET USERS ================= */
exports.getUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    let filter = {
      companyId: req.user.companyId
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (req.user.role === "branch_manager") {
      filter.branchId = req.user.branchId;
    }

    const users = await User.find(filter).select("-password");

    res.json(users);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= UPDATE USER ================= */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const query = { _id: id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;

    const user = await User.findOneAndUpdate(
      query,
      req.body,
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found in your company" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= DELETE USER ================= */
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== "company_admin" && req.user.role !== "branch_manager") {
      return res.status(403).json({ message: "Access Denied" });
    }
    const { id } = req.params;
    const query = { _id: id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;

    await User.findOneAndDelete(query);
    res.json({ message: "User identity purged" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
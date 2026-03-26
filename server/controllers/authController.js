const Company = require("../models/Company");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Plan = require("../models/Plan");
const SystemLog = require("../models/SystemLog");
const { seedMasterDataForCompany } = require("../utils/masterSeeder");

// ============================
// REGISTER COMPANY + ADMIN
// ============================
exports.registerCompany = async (req, res) => {
  try {
    const { companyName, adminName, email, phone, password } = req.body;

    // Validation
    if (!companyName || !adminName || !email || !password) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    // B. Get or Create Demo Plan
    let demoPlan = await Plan.findOne({ name: "Demo", price: 0 });
    if (!demoPlan) {
      demoPlan = await Plan.create({
        name: "Demo",
        duration: 7,
        price: 0,
        features: ["Basic CRM access", "Limited leads", "Limited deals"],
        isActive: true
      });
    }

    // C. Create company with Demo Plan
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + demoPlan.duration);

    const company = await Company.create({
      name: companyName,
      email,
      phone: phone || "",
      planId: demoPlan._id,
      startDate,
      endDate,
      subscriptionStatus: "active"
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const user = await User.create({
      name: adminName,
      email,
      password: hashedPassword,
      role: "company_admin",
      companyId: company._id
    });

    // Seed Master Data for new company
    await seedMasterDataForCompany(company._id, user._id);

    res.status(201).json({
      message: "Company Registered Successfully",
      company,
      user
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ============================
// LOGIN
// ============================
// exports.createSuperAdmin = async (req, res) => {
//   try {
//     const bcrypt = require("bcryptjs");
//     const User = require("../models/User");

//     const hashedPassword = await bcrypt.hash("123456", 10);

//     const user = await User.create({
//       name: "Super Admin",
//       email: "super@admin.com",
//       password: hashedPassword,
//       role: "super_admin",
//       companyId: null
//     });

//     res.json({ message: "Super Admin Created", user });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    const user = await User.findOne({ 
      email: new RegExp(`^${emailTrimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") 
    }).populate("companyId");

    if (!user) {
      return res.status(400).json({
        message: "No account found with this email. Check the email or ask your admin to create your user account."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Your account is inactive. Please contact your administrator."
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, companyId: user.companyId, branchId: user.branchId || null },
      process.env.JWT_SECRET,
      { expiresIn: "10h" }
    );

    // [New] LOG Login Activity
    try {
      await SystemLog.create({
        userId: user._id,
        companyId: user.companyId,
        action: "login",
        ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local",
        userAgent: req.headers["user-agent"] || "",
        location: "Detected via IP", // In a real app, you'd use a geoIP service here
        status: "success"
      });
    } catch (logErr) {
      console.error("Error creating system log:", logErr);
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // Fetch subscription info
    let subscription = null;
    if (user.companyId) {
        const company = user.companyId; // Already populated
        subscription = {
            planId: company.planId,
            startDate: company.startDate,
            endDate: company.endDate,
            status: company.subscriptionStatus
        };
    }

    // ✅ Never return password hash to frontend
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId || null,
      branchId: user.branchId || null,
      status: user.status,
      subscription
    };

    res.json({
      message: "Login Successful",
      token,
      user: safeUser
    });

    // Auto-seed if missing during login
    if (user.companyId) {
      seedMasterDataForCompany(user.companyId, user._id).catch(err => console.error("Login Seeding Fail:", err));
    }


  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================
// GET CURRENT USER (any role)
// ============================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("companyId");
    if (!user) return res.status(404).json({ message: "User not found" });

    let subscription = null;
    if (user.companyId) {
        const company = user.companyId;
        subscription = {
            planId: company.planId,
            startDate: company.startDate,
            endDate: company.endDate,
            status: company.subscriptionStatus
        };
    }

    const userData = user.toObject();
    userData.subscription = subscription;

    res.json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================
// UPDATE PROFILE (any role)
// ============================
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validate email uniqueness if changing email
    if (email) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: "This email is already in use by another account." });
      }
    }

    const updatedFields = {};
    if (name && name.trim()) updatedFields.name = name.trim();
    if (email && email.trim()) updatedFields.email = email.trim().toLowerCase();

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updatedFields,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found." });

    res.json({ success: true, message: "Profile updated successfully.", data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================
// CHANGE PASSWORD (any role)
// ============================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: "Current password is required to set a new password." });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
    }

    // Find user WITH password field
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "The current password you entered is incorrect." });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "Password updated successfully! Please use your new password next time you log in." });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ success: false, message: "Internal server error while updating password." });
  }
};
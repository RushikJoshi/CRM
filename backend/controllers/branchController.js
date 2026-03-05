const Branch = require("../models/Branch");

// Create Branch
exports.createBranch = async (req, res) => {
  try {
    let companyId = req.user.companyId;

    // Override for super_admin if they provide a specific companyId
    if (req.user.role === "super_admin") {
      companyId = req.body.companyId;
    }

    const branch = await Branch.create({
      ...req.body,
      companyId
    });

    res.json({ message: "Branch Created", branch });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Branches
exports.getBranches = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { companyId: req.user.companyId };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const branches = await Branch.find(query);

    res.json(branches);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
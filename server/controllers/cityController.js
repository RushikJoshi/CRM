const City = require("../models/City");

exports.getCities = async (req, res) => {
  try {
    const { q } = req.query;
    let query = { isActive: true };

    if (q) {
      query.name = { $regex: q, $options: "i" };
    }

    const cities = await City.find(query).sort({ name: 1 }).limit(100).lean();
    res.json({ success: true, data: cities });
  } catch (error) {
    console.error("Fetch Cities Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cities" });
  }
};

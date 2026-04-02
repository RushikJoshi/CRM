const City = require("../models/City");

exports.getCities = async (req, res) => {
  try {
    const { q, id } = req.query;
    let query = { isActive: true };

    if (id) {
      query._id = id;
    } else if (q) {
      query.name = { $regex: q, $options: "i" };
    }

    console.log(`🔍 Fetching cities matching: "${q || 'ALL'}"`);
    const cities = await City.find(query).sort({ name: 1 }).limit(20).lean();
    console.log(`✅ Found ${cities.length} cities.`);
    res.json({ success: true, data: cities });
  } catch (error) {
    console.error("❌ Fetch Cities Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cities" });
  }
};

const City = require("../models/City");

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.getCities = async (req, res) => {
  try {
    const { q, id } = req.query;
    const query = { isActive: true };

    if (id) {
      query._id = id;
    } else if (q && String(q).trim()) {
      const search = String(q).trim();
      const safePattern = escapeRegex(search);
      query.$or = [
        { name: { $regex: safePattern, $options: "i" } },
        { state: { $regex: safePattern, $options: "i" } }
      ];
    }

    console.log(`[CITY] Fetching cities matching: "${q || "ALL"}"`);
    const cities = await City.find(query).sort({ name: 1 }).limit(20).lean();
    console.log(`[CITY] Found ${cities.length} cities.`);
    return res.json({ success: true, data: cities });
  } catch (error) {
    console.error("[CITY] Fetch Cities Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch cities" });
  }
};

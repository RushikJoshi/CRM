const City = require("../models/City");

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.getCities = async (req, res) => {
  try {
    const { q, search, id } = req.query;
    const searchTerm = String(q ?? search ?? "").trim();
    // Keep backward compatibility with older records that do not have isActive set.
    const query = { isActive: { $ne: false } };

    if (id) {
      query._id = id;
    } else if (searchTerm) {
      const safePattern = escapeRegex(searchTerm);
      query.$or = [
        { name: { $regex: safePattern, $options: "i" } },
        { state: { $regex: safePattern, $options: "i" } }
      ];
    }

    console.log(`[CITY] Fetching cities matching: "${searchTerm || "ALL"}"`);
    const cities = await City.find(query).sort({ name: 1 }).limit(20).lean();
    console.log(`[CITY] Found ${cities.length} cities.`);
    return res.json({ success: true, data: cities });
  } catch (error) {
    console.error("[CITY] Fetch Cities Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch cities" });
  }
};

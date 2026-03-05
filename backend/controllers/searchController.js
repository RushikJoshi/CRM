const Lead = require("../models/Lead");
const Customer = require("../models/Customer");
const Contact = require("../models/Contact");
const Deal = require("../models/Deal");

/**
 * Global Enterprise Search Engine
 * Searches across multiple entity namespaces with jurisdictional filtering.
 */
exports.globalSearch = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json({ success: true, data: [] });

        const regex = new RegExp(query, "i");
        const companyId = req.user.companyId;

        // Shared Filter Base
        const baseFilter = { companyId, isDeleted: { $ne: true } };

        // Execute search across entities in parallel
        const [leads, customers, contacts, deals] = await Promise.all([
            Lead.find({ ...baseFilter, name: regex }).limit(5),
            Customer.find({ ...baseFilter, name: regex }).limit(5),
            Contact.find({ ...baseFilter, name: regex }).limit(5),
            Deal.find({ ...baseFilter, title: regex }).limit(5)
        ]);

        const results = [
            ...leads.map(l => ({ id: l._id, name: l.name, type: "Lead", link: "/leads" })),
            ...customers.map(c => ({ id: c._id, name: c.name, type: "Customer", link: "/customers" })),
            ...contacts.map(co => ({ id: co._id, name: co.name, type: "Contact", link: "/contacts" })),
            ...deals.map(d => ({ id: d._id, name: d.title, type: "Deal", link: "/deals" }))
        ];

        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

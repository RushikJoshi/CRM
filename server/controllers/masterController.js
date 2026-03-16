const MasterData = require("../models/MasterData");

// Create MasterData
exports.createMasterData = async (req, res) => {
    try {
        const data = await MasterData.create({
            ...req.body,
            companyId: req.user.companyId,
            createdBy: req.user.id
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get MasterData with Search, Filter, Pagination
exports.getMasterData = async (req, res) => {
    try {
        const { type, search, status, page = 1, limit = 50 } = req.query;
        let query = { companyId: req.user.companyId };

        // Auto-Seed if database is empty for this company
        const count = await MasterData.countDocuments({ companyId: req.user.companyId });
        if (count === 0 && req.user.companyId) {
            const { seedMasterDataForCompany } = require("../utils/masterSeeder");
            await seedMasterDataForCompany(req.user.companyId, req.user.id);
        }

        if (type) query.type = type;
        if (status) query.status = status;
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const data = await MasterData.find(query)
            .sort({ order: 1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await MasterData.countDocuments(query);

        res.json({
            success: true,
            data,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update MasterData
exports.updateMasterData = async (req, res) => {
    try {
        const updated = await MasterData.findOneAndUpdate(
            { _id: req.params.id, companyId: req.user.companyId },
            req.body,
            { new: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete MasterData
exports.deleteMasterData = async (req, res) => {
    try {
        await MasterData.findOneAndDelete({
            _id: req.params.id,
            companyId: req.user.companyId
        });
        res.json({ success: true, message: "Master data deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Bulk Reorder
exports.reorderMasterData = async (req, res) => {
    try {
        const { items } = req.body; // Array of { id, order }
        const operations = items.map((item) => ({
            updateOne: {
                filter: { _id: item.id, companyId: req.user.companyId },
                update: { order: item.order }
            }
        }));
        await MasterData.bulkWrite(operations);
        res.json({ success: true, message: "Order updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

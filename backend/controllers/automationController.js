const AutomationRule = require("../models/AutomationRule");

exports.createRule = async (req, res) => {
    try {
        const rule = await AutomationRule.create({
            ...req.body,
            companyId: req.user.companyId,
            createdBy: req.user.id
        });
        res.status(201).json(rule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRules = async (req, res) => {
    try {
        const rules = await AutomationRule.find({ companyId: req.user.companyId }).sort({ createdAt: -1 });
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateRule = async (req, res) => {
    try {
        const rule = await AutomationRule.findOneAndUpdate(
            { _id: req.params.id, companyId: req.user.companyId },
            req.body,
            { new: true }
        );
        res.json(rule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteRule = async (req, res) => {
    try {
        await AutomationRule.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
        res.json({ message: "Automation Rule deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

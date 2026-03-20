const Pipeline = require("../models/Pipeline");
const Stage = require("../models/Stage");

// ── GET ALL PIPELINES ────────────────────────────────────────────────────────
exports.getPipelines = async (req, res) => {
    try {
        const { companyId, id: userId } = req.user;

        let pipelines = await Pipeline.find({ companyId });

        // If no pipeline exists for this company, bootstrap a default sales pipeline
        if (pipelines.length === 0) {
            const pipeline = await Pipeline.create({
                name: "Standard Sales Pipeline",
                description: "Default waterfall CRM sales pipeline",
                companyId,
                createdBy: userId
            });

            // Odoo-style 5-stage pipeline + Lost (not a stage column in kanban)
            const defaultStages = [
                { name: "New", probability: 10, winLikelihood: "open" },
                { name: "Qualified", probability: 25, winLikelihood: "open" },
                { name: "Proposition", probability: 50, winLikelihood: "open" },
                { name: "Negotiation", probability: 75, winLikelihood: "open" },
                { name: "Won", probability: 100, winLikelihood: "won" },
                { name: "Lost", probability: 0, winLikelihood: "lost" }
            ];

            await Stage.insertMany(
                defaultStages.map((s, index) => ({
                    name: s.name,
                    pipelineId: pipeline._id,
                    order: index + 1,
                    probability: s.probability,
                    winLikelihood: s.winLikelihood,
                    isSystem: true,
                    companyId,
                    createdBy: userId
                }))
            );

            pipelines = [pipeline];
        }

        res.json({ success: true, data: pipelines });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET PIPELINE STAGES ──────────────────────────────────────────────────────
exports.getPipelineStages = async (req, res) => {
    try {
        const { companyId } = req.user;
        const { pipelineId } = req.params;
        const stages = await Stage.find({ companyId, pipelineId }).sort({ order: 1 });
        res.json({ success: true, data: stages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── CREATE PIPELINE ─────────────────────────────────────────────────────────
exports.createPipeline = async (req, res) => {
    try {
        const { name, description } = req.body;
        const { companyId, id: userId } = req.user;

        const pipeline = await Pipeline.create({
            name,
            description,
            companyId,
            createdBy: userId
        });

        res.status(201).json({ success: true, data: pipeline });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── CREATE STAGE ────────────────────────────────────────────────────────────
exports.createStage = async (req, res) => {
    try {
        const { name, pipelineId, order, probability, winLikelihood } = req.body;
        const { companyId, id: userId } = req.user;

        const stage = await Stage.create({
            name,
            pipelineId,
            order,
            probability,
            winLikelihood,
            companyId,
            createdBy: userId
        });

        res.status(201).json({ success: true, data: stage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── UPDATE STAGE ─────────────────────────────────────────────────────────────
exports.updateStage = async (req, res) => {
    try {
        const { stageId } = req.params;
        const { name, order, probability, winLikelihood } = req.body || {};
        const { companyId } = req.user;

        const stage = await Stage.findOne({ _id: stageId, companyId });
        if (!stage) return res.status(404).json({ success: false, message: "Stage not found" });

        if (typeof name === "string" && name.trim()) stage.name = name.trim();
        if (typeof order === "number") stage.order = order;
        if (probability != null && !Number.isNaN(Number(probability))) stage.probability = Number(probability);
        if (typeof winLikelihood === "string" && ["open", "won", "lost"].includes(winLikelihood)) stage.winLikelihood = winLikelihood;

        await stage.save();
        res.json({ success: true, data: stage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── DELETE STAGE ─────────────────────────────────────────────────────────────
exports.deleteStage = async (req, res) => {
    try {
        const { stageId } = req.params;
        const { companyId } = req.user;

        const stage = await Stage.findOne({ _id: stageId, companyId });
        if (!stage) return res.status(404).json({ success: false, message: "Stage not found" });
        if (stage.isSystem) return res.status(400).json({ success: false, message: "System stages cannot be deleted" });

        await Stage.deleteOne({ _id: stageId, companyId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── REORDER STAGES ───────────────────────────────────────────────────────────
exports.reorderStages = async (req, res) => {
    try {
        const { pipelineId, orderedStageIds } = req.body || {};
        const { companyId } = req.user;

        if (!pipelineId || !Array.isArray(orderedStageIds) || orderedStageIds.length === 0) {
            return res.status(400).json({ success: false, message: "pipelineId and orderedStageIds are required" });
        }

        const stages = await Stage.find({ companyId, pipelineId });
        const stageIds = new Set(stages.map((s) => String(s._id)));
        const filtered = orderedStageIds.map(String).filter((id) => stageIds.has(id));

        // Apply order starting at 1
        await Promise.all(
            filtered.map((id, idx) => Stage.updateOne({ _id: id, companyId }, { $set: { order: idx + 1 } }))
        );

        const updated = await Stage.find({ companyId, pipelineId }).sort({ order: 1 });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

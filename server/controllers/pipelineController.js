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

            const defaultStages = [
                { name: "New Lead", probability: 5, winLikelihood: "open" },
                { name: "Attempted Contact", probability: 10, winLikelihood: "open" },
                { name: "Contacted", probability: 20, winLikelihood: "open" },
                { name: "Qualified", probability: 35, winLikelihood: "open" },
                { name: "Prospect", probability: 50, winLikelihood: "open" },
                { name: "Needs Analysis", probability: 55, winLikelihood: "open" },
                { name: "Proposal Sent", probability: 65, winLikelihood: "open" },
                { name: "Negotiation", probability: 80, winLikelihood: "open" },
                { name: "Decision Pending", probability: 85, winLikelihood: "open" },
                { name: "Closed Won", probability: 100, winLikelihood: "won" },
                { name: "Closed Lost", probability: 0, winLikelihood: "lost" }
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

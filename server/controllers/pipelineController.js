const Pipeline = require("../models/Pipeline");
const Lead = require("../models/Lead");

// ── DEFAULT STAGES (used when a company is created) ─────────────────────────
const DEFAULT_STAGES = [
    { name: "New",         order: 1, color: "#0ea5e9", probability: 10 },
    { name: "Qualified",   order: 2, color: "#8b5cf6", probability: 30 },
    { name: "Proposal",    order: 3, color: "#f59e0b", probability: 60 },
    { name: "Won",         order: 4, color: "#10b981", probability: 100 }
];

// ── HELPER: create a fresh pipeline for a company ────────────────────────────
exports.createDefaultPipeline = async (companyId, createdBy) => {
    const exists = await Pipeline.findOne({ companyId });
    if (exists) return exists; // Idempotent

    const pipeline = await Pipeline.create({
        name: "Main Pipeline",
        companyId,
        createdBy: createdBy || null,
        stages: DEFAULT_STAGES
    });

    console.log("DEFAULT PIPELINE CREATED:", pipeline._id, "STAGES:", pipeline.stages.length);
    return pipeline;
};

// ── GET PIPELINE (Company / Branch / Sales) ───────────────────────────────────
// NEVER returns null — creates default pipeline if none exists yet.
exports.getPipeline = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ success: false, message: "Company ID missing from session." });
        }

        let pipeline = await Pipeline.findOne({ companyId }).lean();

        // AUTO-HEAL: If pipeline doesn't exist yet, create a default one silently
        if (!pipeline) {
            console.log("PIPELINE NOT FOUND — Auto-creating default for company:", companyId);
            const created = await Pipeline.create({
                name: "Main Pipeline",
                companyId,
                stages: DEFAULT_STAGES
            });
            pipeline = created.toObject();
        }

        console.log("PIPELINE FETCHED:", pipeline._id);
        console.log("TOTAL STAGES:", pipeline.stages.length);

        res.json({ success: true, data: pipeline });
    } catch (error) {
        console.error("GET PIPELINE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET PIPELINE BY COMPANY ID (Super Admin) ─────────────────────────────────
exports.getPipelineByCompanyId = async (req, res) => {
    try {
        const { companyId } = req.params;
        const pipeline = await Pipeline.findOne({ companyId }).lean();

        if (!pipeline) {
            return res.status(404).json({ success: false, message: "No pipeline found for this company." });
        }

        res.json({ success: true, data: pipeline });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── UPDATE PIPELINE (Super Admin only) ───────────────────────────────────────
// Always replaces FULL stages array. No partial updates.
exports.updatePipelineByCompanyId = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { name, stages } = req.body;

        if (!stages || !Array.isArray(stages)) {
            return res.status(400).json({ success: false, message: "stages array is required." });
        }

        // 1. Fetch ORIGINAL pipeline to see what stages might be removed
        const originalPipeline = await Pipeline.findOne({ companyId });
        const oldStageNames = originalPipeline ? originalPipeline.stages.map(s => s.name.toLowerCase()) : [];

        // 2. Assign clean order values based on position
        const cleanStages = stages.map((s, idx) => ({
            ...s,
            order: idx + 1,
            tempId: undefined  // strip any frontend-only temp IDs
        }));

        const newStageNames = cleanStages.map(s => s.name.toLowerCase());

        // 3. FULL REPLACEMENT via findOneAndUpdate
        const updatedPipeline = await Pipeline.findOneAndUpdate(
            { companyId },
            {
                $set: {
                    name: name || "Main Pipeline",
                    stages: cleanStages
                }
            },
            { new: true, upsert: true, runValidators: true }
        ).lean();

        // 4. MIGRATION: Find leads that are in "Deleted" stages and move them to the FIRST new stage
        const deletedStageNames = oldStageNames.filter(name => !newStageNames.includes(name));
        
        if (deletedStageNames.length > 0 && updatedPipeline.stages.length > 0) {
            const firstStageName = updatedPipeline.stages[0].name;
            const deletedRegex = deletedStageNames.map(name => new RegExp(`^${name}$`, "i"));

            const migrateResult = await Lead.updateMany(
                { 
                    companyId, 
                    stage: { $in: deletedRegex } 
                },
                { 
                    $set: { 
                        stage: firstStageName,
                        stageUpdatedAt: new Date() 
                    } 
                }
            );
            console.log(`PIPELINE SYNC: Migrated ${migrateResult.nModified || migrateResult.modifiedCount || 0} leads from deleted stages to "${firstStageName}"`);
        }

        console.log("PIPELINE UPDATED:", updatedPipeline._id);
        console.log("STAGES COUNT:", updatedPipeline.stages.length);

        res.json({ success: true, data: updatedPipeline });
    } catch (error) {
        console.error("UPDATE PIPELINE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * MIGRATION: Enforce ONE pipeline per company.
 *
 * For each company:
 * 1. Keep the pipeline with the most stages (most recent update as tiebreaker)
 * 2. Merge stages from other pipelines into the keeper (no duplicates by name)
 * 3. Delete all other pipelines
 *
 * Run: node server/migrateToSinglePipeline.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/crm";

// Minimal inline schemas to avoid circular dependency issues
const stageSchema = new mongoose.Schema({ name: String, order: Number, color: String, probability: Number }, { _id: true });
const pipelineSchema = new mongoose.Schema({
    companyId: mongoose.Schema.Types.ObjectId,
    name: String,
    isDefault: Boolean,
    stages: [stageSchema]
}, { timestamps: true });
const Pipeline = mongoose.model("Pipeline", pipelineSchema);

async function migrate() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected. Starting single-pipeline migration...\n");

    const companyIds = await Pipeline.distinct("companyId");
    console.log(`Found ${companyIds.length} companies with pipeline data.\n`);

    for (const cid of companyIds) {
        const pipelines = await Pipeline.find({ companyId: cid }).sort({ "stages.length": -1, updatedAt: -1 });

        if (pipelines.length <= 1) {
            console.log(`Company ${cid}: Already has 1 pipeline. Skipping.`);
            continue;
        }

        // Pick the keeper: most stages, then newest
        const sorted = [...pipelines].sort((a, b) => {
            const diff = (b.stages?.length || 0) - (a.stages?.length || 0);
            return diff !== 0 ? diff : new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        const keeper = sorted[0];
        const others = sorted.slice(1);

        // Merge unique stage names from other pipelines into keeper
        const existingNames = new Set(keeper.stages.map(s => s.name.toLowerCase().trim()));
        const toMerge = [];
        for (const pl of others) {
            for (const stage of (pl.stages || [])) {
                if (!existingNames.has(stage.name.toLowerCase().trim())) {
                    existingNames.add(stage.name.toLowerCase().trim());
                    toMerge.push(stage);
                }
            }
        }

        if (toMerge.length > 0) {
            keeper.stages = [
                ...keeper.stages,
                ...toMerge.map((s, idx) => ({ ...s.toObject(), order: keeper.stages.length + idx + 1 }))
            ];
            await keeper.save();
            console.log(`Company ${cid}: Merged ${toMerge.length} extra stages into keeper "${keeper.name}".`);
        }

        // Delete all other pipelines
        const deleteIds = others.map(p => p._id);
        await Pipeline.deleteMany({ _id: { $in: deleteIds } });
        console.log(`Company ${cid}: Deleted ${deleteIds.length} redundant pipelines. Keeper has ${keeper.stages.length} stages.`);
    }

    console.log("\nMigration complete!");
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load Environment Variables from the same folder
dotenv.config({ path: path.join(__dirname, ".env") });

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/crm";

async function cleanup() {
    try {
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB for Pipeline Cleanup...");

        const Pipeline = mongoose.model("Pipeline", new mongoose.Schema({
            companyId: mongoose.Schema.Types.ObjectId,
            isDefault: Boolean,
            updatedAt: Date
        }, { timestamps: true }));

        // Get all unique company IDs
        const companyIds = await Pipeline.distinct("companyId");
        console.log(`Found ${companyIds.length} companies with pipelines.`);

        for (const cid of companyIds) {
            const pls = await Pipeline.find({ companyId: cid }).sort({ isDefault: -1, updatedAt: -1 });
            
            if (pls.length === 0) continue;

            console.log(`Company ${cid}: ${pls.length} pipelines found.`);

            // The first one in our sorted list should be the ONLY default one
            await Pipeline.findByIdAndUpdate(pls[0]._id, { isDefault: true });
            
            if (pls.length > 1) {
                const otherIds = pls.slice(1).map(p => p._id);
                await Pipeline.updateMany({ _id: { $in: otherIds } }, { isDefault: false });
                console.log(`Unset default for ${otherIds.length} other pipelines.`);
            }
        }

        console.log("Pipeline Cleanup Successful!");
        process.exit(0);

    } catch (err) {
        console.error("Cleanup Error:", err);
        process.exit(1);
    }
}

cleanup();

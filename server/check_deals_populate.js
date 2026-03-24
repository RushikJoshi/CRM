const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Deal = require("./models/Deal");
const Pipeline = require("./models/Pipeline");
const Stage = require("./models/Stage");
const Lead = require("./models/Lead");
const User = require("./models/User");
const Customer = require("./models/Customer");

async function checkDeals() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        console.log("Attempting Deal.find().populate(...)");
        const deals = await Deal.find({})
            .populate("assignedTo", "name email")
            .populate("leadId", "name email phone companyName source priority")
            .populate("customerId", "name")
            .populate("stageId")
            .populate("pipelineId")
            .sort({ createdAt: -1 })
            .limit(10);

        console.log(`Successfully fetched ${deals.length} deals with population.`);
        process.exit(0);
    } catch (err) {
        console.error("POPULATE ERROR:", err);
        process.exit(1);
    }
}

checkDeals();

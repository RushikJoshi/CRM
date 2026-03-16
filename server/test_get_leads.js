const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const Lead = require("./models/Lead");
const Todo = require("./models/Todo");

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const leads = await Lead.find({ isDeleted: false }).limit(5);
        console.log(`Found ${leads.length} leads`);

        const leadsWithTaskCounts = await Promise.all(
            leads.map(async (lead) => {
                const pendingTasksCount = await Todo.countDocuments({
                    leadId: lead._id,
                    status: { $in: ["Pending", "In Progress"] }
                });
                return { ...lead.toObject(), pendingTasksCount };
            })
        );

        console.log("Success! First lead task count:", leadsWithTaskCounts[0]?.pendingTasksCount);
        process.exit(0);
    } catch (error) {
        console.error("Test Failed:", error);
        process.exit(1);
    }
}

test();

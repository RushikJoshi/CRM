const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Lead = require("./models/Lead");

async function checkLeadDetailed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const id = "69bce7921c6e2437ba45d0f5";
        const lead = await Lead.findById(id);
        if (!lead) {
            console.log("Lead NOT found!");
        } else {
            console.log("Lead:", JSON.stringify(lead, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error("ERROR:", err);
        process.exit(1);
    }
}

checkLeadDetailed();

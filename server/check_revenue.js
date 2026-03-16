const mongoose = require("mongoose");
const Deal = require("./models/Deal");
require("dotenv").config();

async function checkDeals() {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/crm");
    const deals = await Deal.find({ stage: "Closed Won" });
    console.log("Closed Won Deals:", JSON.stringify(deals, null, 2));

    const total = deals.reduce((acc, deal) => acc + (deal.value || 0), 0);
    console.log("Total Calculated Revenue:", total);

    await mongoose.connection.close();
}

checkDeals();

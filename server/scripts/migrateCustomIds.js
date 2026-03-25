const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env
dotenv.config({ path: path.join(__dirname, "../.env") });

const Company = require("../models/Company");
const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const { getNextCustomId } = require("../utils/idGenerator");

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // 1. Migrate Companies
    const companies = await Company.find({ customId: { $exists: false } });
    console.log(`Found ${companies.length} companies to migrate.`);
    for (const company of companies) {
      const customId = await getNextCustomId({ module: "company", companyName: company.name });
      const companyCode = customId.split('-')[0];
      await Company.findByIdAndUpdate(company._id, { customId, code: companyCode });
      console.log(`Migrated Company: ${company.name} -> ${customId}`);
    }

    // 2. Migrate Leads
    const leads = await Lead.find({ customId: { $exists: false } });
    console.log(`Found ${leads.length} leads to migrate.`);
    for (const lead of leads) {
      try {
        const customId = await getNextCustomId({ companyId: lead.companyId, module: "lead" });
        await Lead.findByIdAndUpdate(lead._id, { customId });
        console.log(`Migrated Lead: ${lead.name} -> ${customId}`);
      } catch (e) {
        console.error(`Failed to migrate Lead ${lead._id} (${lead.name}): ${e.message}`);
      }
    }

    // 3. Migrate Deals
    const deals = await Deal.find({ customId: { $exists: false } });
    console.log(`Found ${deals.length} deals to migrate.`);
    for (const deal of deals) {
      try {
        const customId = await getNextCustomId({ companyId: deal.companyId, module: "deal" });
        await Deal.findByIdAndUpdate(deal._id, { customId });
        console.log(`Migrated Deal: ${deal.title} -> ${customId}`);
      } catch (e) {
        console.error(`Failed to migrate Deal ${deal._id} (${deal.title}): ${e.message}`);
      }
    }


    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

migrate();

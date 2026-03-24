const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Lead = require("./models/Lead");
const Pipeline = require("./models/Pipeline");

async function testUpdateStage() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const lead = await Lead.findOne({ isDeleted: false });
        if (!lead) {
            console.log("No lead found to test.");
            process.exit(0);
        }

        const { updateLeadStage } = require("./controllers/leadController");
        
        const req = {
            user: {
                id: lead.createdBy,
                companyId: lead.companyId,
                role: "company_admin"
            },
            params: { id: lead._id },
            body: { status: "QUALIFIED" } // Uppercase to test case-insensitivity
        };

        const res = {
            status: (code) => {
                console.log("RES.STATUS:", code);
                return res;
            },
            json: (data) => {
                console.log("RES.JSON:", JSON.stringify(data, null, 2).slice(0, 1000));
            }
        };

        console.log(`Testing stage update for lead ${lead._id} from ${lead.stage} to QUALIFIED`);
        await updateLeadStage(req, res);

        process.exit(0);
    } catch (err) {
        console.error("TEST ERROR:", err);
        process.exit(1);
    }
}

testUpdateStage();

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Lead = require("./models/Lead");
const Deal = require("./models/Deal");
const Pipeline = require("./models/Pipeline");

async function testApi() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const companyId = "65f1a2b3c4d5e6f7a8b9c0d1"; // Dummy
        const userId = "65f1a2b3c4d5e6f7a8b9c0d2";

        const req = {
            user: {
                id: userId,
                companyId: "6798c92e921e1919ba50b329", // Valid looking companyId
                role: "company_admin"
            },
            query: { page: "1", limit: "50" }
        };

        const { getDeals } = require("./controllers/dealController");
        
        const res = {
            status: (code) => {
                console.log("RES.STATUS:", code);
                return res;
            },
            json: (data) => {
                console.log("RES.JSON:", JSON.stringify(data, null, 2).slice(0, 500));
            }
        };

        console.log("Calling getDeals...");
        await getDeals(req, res);

        process.exit(0);
    } catch (err) {
        console.error("TEST ERROR:", err);
        process.exit(1);
    }
}

testApi();

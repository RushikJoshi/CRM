const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User");

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const id = "69b2827d77ece7ae84cd0568";
        const user = await User.findById(id);
        if (!user) {
            console.log("User NOT found!");
        } else {
            console.log("User:", user.name);
            console.log("  Role:", user.role);
            console.log("  CompanyId:", user.companyId);
        }

        process.exit(0);
    } catch (err) {
        console.error("ERROR:", err);
        process.exit(1);
    }
}

checkUser();

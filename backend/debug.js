const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Company = require("./models/Company");
const User = require("./models/User");
const Branch = require("./models/Branch");

async function debug() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        console.log("Testing Company.find({ _id: '' })...");
        try {
            await Company.find({ _id: "" });
        } catch (e) {
            console.log("Caught expected error for Company find:", e.name);
        }

        console.log("Testing Company.find().skip(-1)...");
        try {
            await Company.find({}).skip(-1);
        } catch (e) {
            console.log("Caught expected error for negative skip:", e.name, e.message);
        }

        console.log("Testing Company.find({ name: { $regex: '', $options: 'i' } })...");
        const companies = await Company.find({}).limit(10);
        console.log("Found companies:", companies.length);

        console.log("Testing Branch.find().populate('companyId')...");
        const branches = await Branch.find({}).populate("companyId", "name");
        console.log("Found branches:", branches.length);

        console.log("Testing User.find().populate('companyId')...");
        const users = await User.find({}).populate("companyId", "name").select("-password");
        console.log("Found users:", users.length);

        process.exit(0);
    } catch (err) {
        console.error("DEBUG ERROR:", err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

debug();

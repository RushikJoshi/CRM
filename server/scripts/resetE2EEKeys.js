const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const User = require("../models/User");

const resetKeys = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/edupath_pro";
        console.log("🔗 Connecting to MongoDB...");
        await mongoose.connect(mongoURI);
        console.log("✅ Connected.");

        console.log("🧹 Resetting ALL user E2EE keys...");
        const result = await User.updateMany(
            {},
            {
                $set: {
                    publicKey: null,
                    encryptedPrivateKey: null,
                    privateKeyIv: null
                }
            }
        );

        console.log(`✅ Success! ${result.modifiedCount} users reset.`);
        console.log("🚀 The next time any user logs in, a new PERMANENT key pair will be generated and synced.");
        
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
};

resetKeys();

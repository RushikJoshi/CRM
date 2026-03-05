require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const user = await User.findOne({ email: "super@admin.com" });
        if (user) {
            console.log("Super Admin found:", user);
        } else {
            console.log("Super Admin NOT found");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();

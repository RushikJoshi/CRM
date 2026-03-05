require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({});
        console.log(users.map(u => ({ email: u.email, role: u.role })));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

listUsers();

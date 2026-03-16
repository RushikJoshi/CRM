const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const bcrypt = require('bcryptjs');

// Import model directly using absolute path to be 100% sure
const User = require('./models/User');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const email = 'super@admin.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log("User not found!");
            return;
        }

        console.log("User found:", user.name, "ID:", user._id);

        const newPassword = '123456';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        console.log("Setting password to:", newPassword);
        console.log("New Hash:", hash);

        // Use updateOne to bypass any potential middle-ware/hooks issues
        await User.updateOne({ _id: user._id }, { $set: { password: hash } });

        // Verify immediately
        const updatedUser = await User.findById(user._id);
        const match = await bcrypt.compare(newPassword, updatedUser.password);
        console.log("Verification - Does it match now?", match);

        if (match) {
            console.log("PASSWORD RESET SUCCESSFUL");
        } else {
            console.error("PASSWORD RESET FAILED VERIFICATION");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();

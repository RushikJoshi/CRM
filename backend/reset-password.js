// reset-password.js — Emergency password reset utility
// Run: node reset-password.js [optional-email]
// Without email argument: resets ALL users to 123456
// With email argument: resets only that specific user

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        const User = require("./models/User");
        const targetEmail = process.argv[2]; // optional: node reset-password.js user@email.com

        const hash = await bcrypt.hash("123456", 10);

        if (targetEmail) {
            // Reset specific user
            const result = await User.findOneAndUpdate(
                { email: targetEmail },
                { password: hash, status: "active" },
                { new: true }
            );
            if (result) {
                console.log(`✅ Password reset for: ${result.name} (${result.email}) → 123456`);
            } else {
                console.log(`❌ No user found with email: ${targetEmail}`);
            }
        } else {
            // Reset ALL users
            await User.updateMany({}, { password: hash, status: "active" });
            const users = await User.find({}, "name email role companyId");
            console.log("✅ ALL passwords reset to: 123456\n");
            console.table(users.map(u => ({
                name: u.name,
                email: u.email,
                role: u.role,
                companyId: u.companyId?.toString() || "N/A (super_admin)"
            })));
        }

        mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    })
    .catch((err) => {
        console.error("❌ MongoDB connection failed:", err.message);
        process.exit(1);
    });

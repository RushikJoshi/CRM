const mongoose = require('mongoose');
const User = require('./backend/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './backend/.env' });

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'super@admin.com' });
        if (!user) {
            console.log('User not found');
            return;
        }
        console.log('User found:', user.name);
        const match = await bcrypt.compare('123456', user.password);
        console.log('Does "123456" match current password hash?', match);

        // Also check if there are multiple users with same email (shouldn't be)
        const count = await User.countDocuments({ email: 'super@admin.com' });
        console.log('Count with this email:', count);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();

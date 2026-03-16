const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'super@admin.com' });
        if (!user) return;

        console.log('User found:', user.name);
        const match123 = await bcrypt.compare('123456', user.password);
        console.log('Does "123456" match?', match123);

        const matchTest = await bcrypt.compare('Test@1234', user.password);
        console.log('Does "Test@1234" match?', matchTest);

        // Reset to 123456 for convenience
        user.password = await bcrypt.hash('123456', 10);
        await user.save();
        console.log('Password reset to 123456 for super@admin.com');

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();

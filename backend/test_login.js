const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

async function verifyLogin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'super@admin.com';
        const passwordTyped = '123456';

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User found:', user.email);
        console.log('Hash in DB:', user.password);

        const isMatch = await bcrypt.compare(passwordTyped, user.password);
        console.log('typed:', passwordTyped);
        console.log('match result:', isMatch);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

verifyLogin();

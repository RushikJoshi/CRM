const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

async function verifyLogin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Name:', mongoose.connection.name);
        const email = 'super@admin.com';

        const users = await User.find({ email });
        console.log('Found', users.length, 'users with email', email);

        for (const u of users) {
            console.log('ID:', u._id, 'Name:', u.name, 'Hash:', u.password);
            const m = await bcrypt.compare('123456', u.password);
            console.log('Result for 123456:', m);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

verifyLogin();

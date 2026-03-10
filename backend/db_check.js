const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB:', mongoose.connection.name);

        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        // Check if 'users' collection has any data
        const User = require('./models/User');
        const count = await User.countDocuments();
        console.log('Total users:', count);

        if (count > 0) {
            const users = await User.find().limit(5);
            console.log('Sample Users:', users.map(u => ({ email: u.email, name: u.name, id: u._id })));
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();

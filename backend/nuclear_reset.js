const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

async function reset() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'super@admin.com';
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            return;
        }

        const newHash = bcrypt.hashSync('123456', 10);
        console.log('BEFORE UPDATE - Hash:', user.password);

        await User.updateOne({ _id: user._id }, { $set: { password: newHash } });

        const verification = await User.findById(user._id);
        console.log('AFTER UPDATE - Hash:', verification.password);
        console.log('Match test for 123456:', bcrypt.compareSync('123456', verification.password));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

reset();

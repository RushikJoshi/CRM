const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function listAll() {
    try {
        const client = await mongoose.connect(process.env.MONGO_URI);
        const adminDb = mongoose.connection.db.admin();
        const dbs = await adminDb.listDatabases();
        console.log('Databases:', dbs.databases.map(d => d.name));

        for (const dbInfo of dbs.databases) {
            const db = mongoose.connection.client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            if (collections.some(c => c.name === 'users')) {
                const users = await db.collection('users').find({ email: 'super@admin.com' }).toArray();
                if (users.length > 0) {
                    console.log(`Found in DB [${dbInfo.name}]:`, users.map(u => ({ id: u._id, hash: u.password })));
                }
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

listAll();

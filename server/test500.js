const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config();

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const ca = await User.findOne({ role: 'company_admin' });
    if (!ca) { console.log('No CA found'); process.exit(1); }
    const token = jwt.sign({ id: ca._id, role: ca.role, companyId: ca.companyId, branchId: ca.branchId || null }, process.env.JWT_SECRET, { expiresIn: '1d' });
    console.log('Got token for:', ca.email);

    const q = (path) => new Promise(res => {
        const req = http.request({
            hostname: 'localhost', port: 5000, path, method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        }, r => {
            let b = ''; r.on('data', c => b += c); r.on('end', () => res(b));
        });
        req.end();
    });

    const inq = await q('/api/inquiries');
    console.log('/api/inquiries response:', inq);

    const notif = await q('/api/notifications/unread');
    console.log('/api/notifications/unread response:', notif);

    process.exit(0);
}
test().catch(console.error);

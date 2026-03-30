const EmailLog = require("../models/EmailLog");
const Activity = require("../models/Activity");
const Lead = require("../models/Inquiry");
const path = require("path");

exports.trackOpen = async (req, res) => {
    try {
        const { emailId } = req.params;
        const email = await EmailLog.findById(emailId);

        if (email && email.status !== 'OPENED' && email.status !== 'CLICKED') {
            email.status = 'OPENED';
            email.openedAt = new Date();
            await email.save();

            // Create Activity
            const { logActivity } = require("../utils/activityService");
            await logActivity({
                type: "email",
                leadId: email.leadId,
                userId: email.userId,
                companyId: email.companyId,
                message: `Email Opened: ${email.subject}`,
                metadata: { emailId: email._id, status: 'OPENED' }
            });
        }
    } catch (err) {
        console.error("TRACK OPEN ERROR:", err.message);
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
    );
    res.writeHead(200, {
        "Content-Type": "image/gif",
        "Content-Length": pixel.length,
    });
    res.end(pixel);
};

exports.trackClick = async (req, res) => {
    try {
        const { emailId } = req.params;
        const { redirect } = req.query;
        const email = await EmailLog.findById(emailId);

        if (email) {
            email.status = 'CLICKED';
            if (!email.clickedAt) email.clickedAt = new Date();
            await email.save();

            // Create Activity
            const { logActivity } = require("../utils/activityService");
            await logActivity({
                type: "email",
                leadId: email.leadId,
                userId: email.userId,
                companyId: email.companyId,
                message: `Email Link Clicked: ${email.subject}`,
                metadata: { emailId: email._id, status: 'CLICKED', url: redirect }
            });
        }

        if (redirect) {
            return res.redirect(redirect);
        }
        res.status(404).send("Invalid link");
    } catch (err) {
        console.error("TRACK CLICK ERROR:", err.message);
        res.status(500).send("Internal server error");
    }
};

const express = require("express");
const router = express.Router();
const upload = require("../middleware/fileUpload");
const path = require("path");

// Single file upload
router.post("/single", upload.single("file"), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });
        
        const fileUrl = `${process.env.BACKEND_URL || process.env.BASE_URL || "http://localhost:5003"}/uploads/attachments/${req.file.filename}`;
        
        res.json({
            success: true,
            data: {
                name: req.file.originalname,
                filename: req.file.filename,
                url: fileUrl,
                mimetype: req.file.mimetype,
                size: req.file.size
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

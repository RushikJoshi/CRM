require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* ================= MIDDLEWARE ================= */

// Dynamic CORS configuration
const allowedOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [])
].filter(Boolean).map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
            callback(null, true);
        } else {
            console.warn(`Blocked by CORS: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

/* ================= PUBLIC ROUTES ================= */
app.use("/api/public", require("./routes/publicRoutes"));

/* ================= INTERNAL ROUTES ================= */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/leads", require("./routes/leadRoutes"));
app.use("/api/branches", require("./routes/branchRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/deals", require("./routes/dealRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/super-admin", require("./routes/superAdminRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/master", require("./routes/masterRoutes"));
app.use("/api/crm", require("./routes/crmRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/activities", require("./routes/activityRoutes"));
app.use("/api/automation", require("./routes/automationRoutes"));
app.use("/api/inquiries", require("./routes/inquiryRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

app.get("/", (req, res) => {
    res.json({
        status: "CRM Server Running 🚀",
        version: "2.0"
    });
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
    console.error("🔥 ERROR DETECTED:", err.name, "-", err.message);
    if (err.stack) console.error(err.stack);
    res.status(500).json({ success: false, message: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
});

/* ================= DATABASE ================= */
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Atlas Connected"))
    .catch(err => console.error("❌ DB Error:", err));

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

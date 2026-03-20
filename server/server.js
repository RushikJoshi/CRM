require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const server = http.createServer(app);

// ── Dynamic CORS configuration ────────────────────────────────────────────────
const allowedOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [])
].filter(Boolean).map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // Allow all localhost origins for development
        if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
            callback(null, true);
        } else {
            console.warn(`Blocked by CORS: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "cache-control", "Pragma", "pragma", "Expires", "expires", "Accept", "X-Requested-With"],
    credentials: true
}));

/* ================= SECURITY ================= */
app.use(helmet());

// Rate limiting for login/auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many login attempts, please try again after 15 minutes"
});
app.use("/api/auth/login", authLimiter);

// Global API rate limit (per IP) for production resilience
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.API_RATE_LIMIT_MAX || 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later"
});
app.use("/api/", apiLimiter);

// ── Origins handled above ──

// ── Placeholder for relocation ──

app.use(express.json());
app.use("/uploads", express.static("uploads"));

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
app.use("/api/lead-sources", require("./routes/leadSourceRoutes"));
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
app.use("/api/audit-logs", require("./routes/auditLogRoutes"));
app.use("/api/automation", require("./routes/automationRoutes"));
app.use("/api/inquiries", require("./routes/inquiryRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/pipelines", require("./routes/pipelineRoutes"));

app.use("/api/targets", require("./routes/targetRoutes"));
app.use("/api/branch-analytics", require("./routes/branchAnalyticsRoutes"));
app.use("/api/planner", require("./routes/plannerRoutes"));
app.use("/api/uploads", require("./routes/uploadRoutes"));

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

// ── Socket.IO (real-time updates) ─────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
                return callback(null, true);
            }
            const allowedOrigins = [
                process.env.FRONTEND_URL,
                ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [])
            ].filter(Boolean).map(o => o.trim());
            if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true
    }
});

// Basic auth + room join by companyId for scoped broadcasts.
io.use((socket, next) => {
    try {
        const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization || "";
        const token = String(authHeader).replace(/^Bearer\s+/i, "");
        if (!token) return next(new Error("Unauthorized"));
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.user = decoded;
        return next();
    } catch (err) {
        return next(new Error("Unauthorized"));
    }
});

io.on("connection", (socket) => {
    const companyId = socket.data.user?.companyId;
    if (companyId) socket.join(`company:${companyId}`);
});

app.set("io", io);

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

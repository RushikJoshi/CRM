require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
app.set("trust proxy", 1); // Specific proxy trust for rate limiting stability
const server = http.createServer(app);

// ── Dynamic CORS configuration ────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
            return callback(null, true);
        }
        console.warn(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Pragma", "Expires", "Accept", "X-Requested-With"],
    credentials: true
}));

/* ================= SECURITY ================= */
app.use(helmet({
    contentSecurityPolicy: false, // We have custom CSP middleware below
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));

// CSP Fix (Production Safe) - Add as middleware
app.use((req, res, next) => {
    if (process.env.NODE_ENV === "production") {
        res.setHeader(
            "Content-Security-Policy",
            "default-src 'self'; " +
            "connect-src 'self' https://app.gitakshmilabs.com https://app.dev.gitakshmilabs.com wss://app.gitakshmilabs.com wss://app.dev.gitakshmilabs.com http://localhost:5003 ws://localhost:5003 https://fonts.googleapis.com https://fonts.gstatic.com https://api.postalpincode.in; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com data:; " +
            "img-src 'self' data: blob:; " +
            "media-src 'self' blob:;"
        );
    }
    next();
});

// Global Rate Limiter (Prevent 429 Errors & stabilize production)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50000, // Very high limit for production-grade stability
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Your session has too many requests or is looping. Please refresh the page.",
        code: 429
    }
});
app.use("/api/", limiter);

// ── Origins handled above ──

// ── Placeholder for relocation ──
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

/* ================= PUBLIC ROUTES ================= */
app.use("/api/public", require("./routes/publicRoutes"));
app.use("/api/track", require("./routes/trackRoutes"));
// app.use("/api/events", forceJsonResponse(false), require("./routes/trackRoutes")); 

function forceJsonResponse(val) {
    return (req, res, next) => {
        next();
    };
}

/* ================= INTERNAL ROUTES ================= */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/leads", require("./routes/leadRoutes"));
app.use("/api/lead-sources", require("./routes/leadSourceRoutes"));
app.use("/api/cities", require("./routes/cityRoutes"));
app.use("/api/branches", require("./routes/branchRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/deals", require("./routes/dealRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/super-admin", require("./routes/superAdminRoutes"));
app.use("/api/super_admin", require("./routes/superAdminRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/master", require("./routes/masterRoutes"));
app.use("/api/crm", require("./routes/crmRoutes"));
app.use("/api/meetings", require("./routes/meetingRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/activities", require("./routes/activityRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/audit-logs", require("./routes/auditLogRoutes"));
app.use("/api/automation", require("./routes/automationRoutes"));
app.use("/api/inquiries", require("./routes/inquiryRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/email", require("./routes/emailRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/pipeline", require("./routes/pipelineRoutes"));
app.use("/api/test", require("./routes/testRoutes"));
app.use("/api/follow-ups", require("./routes/followUpRoutes"));

app.use("/api/targets", require("./routes/targetRoutes"));
app.use("/api/branch-analytics", require("./routes/branchAnalyticsRoutes"));
app.use("/api/planner", require("./routes/plannerRoutes"));
app.use("/api/uploads", require("./routes/uploadRoutes"));
app.use("/api/mass-messaging", require("./routes/campaignRoutes"));

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
    .then(async () => {
        const dbName = mongoose.connection.db.databaseName;
        console.log(`✅ MongoDB Connected to DB: ${dbName}`);

        // ── 🛠️ UNIFIED COLLECTION MIGRATION (Seamless Evolution) ──────────────────
        try {
            const Inquiry = require("./models/Inquiry");
            const City = require("./models/City");
            const defaultCities = require("./utils/defaultCities");
            const db = mongoose.connection.db;

            console.log("🛠️ Starting CRM Data Unification...");

            // ── 🏙️ City Auto-Seed (Ensuring 500+ cities) ──────────────────────────
            const cityCount = await City.countDocuments();
            if (cityCount < defaultCities.length) {
                console.log(`🏙️  City count (${cityCount}) is less than master list (${defaultCities.length}). Seeding missing cities...`);

                const bulkOps = defaultCities.map(city => ({
                    updateOne: {
                        filter: { name: city.name },
                        update: { $setOnInsert: { ...city, isActive: true } },
                        upsert: true
                    }
                }));

                const result = await City.bulkWrite(bulkOps, { ordered: false });
                console.log(`✅ City seeding complete: ${result.upsertedCount} inserted, ${result.modifiedCount} updated.`);
            } else {
                console.log(`🏙️  City collection is healthy with ${cityCount} records.`);
            }

            // 1. Tag all existing inquiries as INQUIRY (if not already)
            const inquirySync = await Inquiry.updateMany(
                { type: { $exists: false } },
                { $set: { type: "INQUIRY" } }
            );
            if (inquirySync.modifiedCount > 0) console.log(`🏷️  Updated ${inquirySync.modifiedCount} legacy records to INQUIRY.`);

            // 2. Check for legacy 'leads' collection
            const collections = await db.listCollections({ name: "leads" }).toArray();
            if (collections.length > 0) {
                const legacyLeads = await db.collection("leads").find({}).toArray();
                if (legacyLeads.length > 0) {
                    console.log(`📡 Moving ${legacyLeads.length} records from 'leads' to unified inquiries...`);

                    for (const lead of legacyLeads) {
                        // Check if already moved to prevent duplicates
                        const exists = await Inquiry.findOne({
                            $or: [
                                { _id: lead._id },
                                { email: lead.email, phone: lead.phone, companyId: lead.companyId, type: "LEAD" }
                            ]
                        });

                        if (!exists) {
                            const { _id, ...leadData } = lead;
                            await Inquiry.create({
                                ...leadData,
                                _id,
                                type: "LEAD",
                                status: lead.status || "ASSIGNED"
                            });
                        }
                    }
                    console.log("✅ Legacy Leads migration complete.");
                }
            }
            console.log("🎉 CRM Data Unification finalized.");
        } catch (migErr) {
            console.error("⚠️  Migration Error:", migErr.message);
        }
    })
    .catch(err => console.error("❌ DB Error:", err));

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

// ── Socket.IO (real-time updates) ─────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: allowedOrigins.concat(["http://localhost:5173", "http://localhost:3000"]),
        methods: ["GET", "POST"],
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

const onlineUsers = new Set();

io.on("connection", (socket) => {
    const userId = socket.data.user?.id;
    const companyId = socket.data.user?.companyId;

    if (userId) {
        socket.join(`user:${userId}`);
        onlineUsers.add(userId);
        console.log(`🔌 User joined room: user:${userId} | Online: ${onlineUsers.size}`);

        // Broadcast presence update (bonus)
        if (companyId) {
            io.to(`company:${companyId}`).emit("presence:update", Array.from(onlineUsers));
        }
    }

    if (companyId) {
        socket.join(`company:${companyId}`);
        console.log(`🏢 User joined room: company:${companyId}`);
    }

    socket.on("chat:join", (conversationId) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`💬 User joined chat: ${conversationId}`);
    });

    socket.on("disconnect", () => {
        if (userId) {
            onlineUsers.delete(userId);
            console.log(`❌ User disconnected: ${userId} | Online: ${onlineUsers.size}`);

            if (companyId) {
                io.to(`company:${companyId}`).emit("presence:update", Array.from(onlineUsers));
            }
        }
    });
});

const { initFollowUpCron } = require("./cron/followUpCron");
initFollowUpCron(io);

const { initCampaignCron } = require("./cron/campaignCron");
initCampaignCron();

const { initMeetingReminderCron } = require("./cron/meetingReminderCron");
initMeetingReminderCron();

app.set("io", io);

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

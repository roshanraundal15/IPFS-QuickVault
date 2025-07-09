require("dotenv").config(); // Load environment variables

const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const http = require("http");
const { WebSocketServer } = require("ws");
const db = require("./config/db");
const fileRoutes = require("./routes/fileRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const server = http.createServer(app);

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Security Headers (Fixed CSP for Assets)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: [
          "'self'",
          "data:",
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com",
          "http://localhost:4000/assets",
        ],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

// ✅ CORS Configuration (Fixes Frontend API Call Issues)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "http://localhost:3000",
      "http://localhost:4001",
      "http://localhost:4000", // Added localhost:4000 here
    ];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        console.log(`✅ CORS Allowed: ${origin || "Unknown (No Origin Header)"}`);
        callback(null, true);
      } else {
        console.warn(`🚫 CORS Blocked: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Debugging Middleware (Logs API Calls)
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} - From: ${req.headers.origin || "Unknown"}`);
  next();
});

// ✅ Serve Static & Uploaded Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// ✅ API Routes
app.use("/api/files", fileRoutes);
app.use("/api/auth", authRoutes);

// ✅ WebSocket Server (Fixes WebSocket Issue)
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("🔗 WebSocket connection established");

  ws.on("message", (message) => {
    console.log(`📩 Received WebSocket message: ${message}`);
    ws.send(`🔄 Echo: ${message}`);
  });

  ws.on("close", () => {
    console.log("🔌 WebSocket connection closed");
  });
});

// ✅ Remove Invalid HTTP Endpoint for WebSocket (This Fixes 404 Issue)
app.get("/ws", (req, res) => {
  res.status(400).json({ error: "WebSocket connections must use ws:// protocol" });
});

// ✅ Fix 404 Handler (Prevents Incorrect Route Issues)
app.use((req, res) => {
  res.status(404).json({ error: "❌ Route not found" });
});

// ✅ Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// ✅ Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Uploaded files available at: http://localhost:${PORT}/uploads/{fileName}`);
  console.log(`🔗 WebSocket running on ws://localhost:${PORT}/ws`);
});

// ✅ Graceful Shutdown Handling (Fixes Database Connection Issues)
const shutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Closing server...`);
  server.close(() => {
    console.log("🔴 Server closed.");
    if (db && db.end) {
      db.end((err) => {
        if (err) console.error("⚠️ Error closing database:", err);
        console.log("🟢 Database connection closed.");
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
};

["SIGINT", "SIGTERM"].forEach((signal) => process.on(signal, () => shutdown(signal)));

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", promise, "reason:", reason);
});

module.exports = app;

require("dotenv").config(); // ✅ Load environment variables first

const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const db = require("./config/db");
const fileRoutes = require("./routes/fileRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Enhanced Content Security Policy (CSP) (🔴 FIXES FONT LOADING ISSUE)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "data:", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "http://localhost:4000"], // Allow API calls
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

// ✅ Dynamic CORS Handling
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3001", "http://localhost:4001"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked request from: ${origin}`);
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

// ✅ Serve Static & Uploaded Files (🔴 FIXES 404 FONT ERROR)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "public/assets"))); // Ensure fonts load properly

// ✅ API Routes
app.use("/api/files", fileRoutes);
app.use("/api/auth", authRoutes);

// ✅ Global Error Handling Middleware (🔴 IMPROVED ERROR LOGGING)
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// ✅ Server Start
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Uploaded files available at: http://localhost:${PORT}/uploads/{fileName}`);
});

// ✅ Graceful Shutdown
const shutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Closing server...`);
  server.close(() => {
    console.log("🔴 Server closed.");
    db.end((err) => {
      if (err) console.error("⚠️ Error closing database:", err);
      console.log("🟢 Database connection closed.");
      process.exit(0);
    });
  });
};

["SIGINT", "SIGTERM"].forEach((signal) => process.on(signal, () => shutdown(signal)));

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", promise, "reason:", reason);
});

module.exports = app;

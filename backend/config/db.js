const mysql = require("mysql2"); // Use mysql2 for async support
require("dotenv").config();

// ✅ Use Connection Pool for Better Performance
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "", // Ensure an empty password works
  database: process.env.DB_NAME || "securedquickshare",
  waitForConnections: true,
  connectionLimit: 10,  // Allow up to 10 simultaneous connections
  queueLimit: 0,
});

// ✅ Check Database Connection Once at Startup
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("✅ MySQL Database connected successfully!");
  connection.release(); // Release the connection after testing
});

module.exports = db;

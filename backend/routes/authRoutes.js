const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret"; // Fallback for security

// User Registration
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (result.length > 0) return res.status(400).json({ message: "Email already exists!" });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

      db.query(sql, [username, email, hashedPassword], (err) => {
        if (err) return res.status(500).json({ error: "Registration failed" });
        res.json({ message: "User registered successfully!" });
      });
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// User Login
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (result.length === 0) return res.status(401).json({ message: "User not found!" });

      const user = result[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials!" });
      }

      // Generate JWT Token
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "2h" });

      res.json({ message: "Login successful!", token, user: { id: user.id, username: user.username, email: user.email } });
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

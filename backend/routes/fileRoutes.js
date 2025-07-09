const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { ethers } = require("ethers");
const crypto = require("crypto"); // For SHA-256 hashing
const db = require("../config/db");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

// 🔹 Ensure `uploads` directory exists
const uploadDir = path.join(__dirname, "../uploads/");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 🔹 Multer Configuration (Handles File Uploads)
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// 🔹 Google Drive Authentication
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../config/credentials.json"),
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});
const drive = google.drive({ version: "v3", auth });

// 🔹 Blockchain Setup
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// ✅ Ensure Contract ABI exists
let contractABI;
try {
  contractABI = require("../artifacts/contracts/FileStorage.sol/FileStorage.json");
} catch (error) {
  console.error("🚨 ERROR: Contract ABI file not found! Make sure Hardhat compiled the contract.");
  process.exit(1);
}

const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI.abi, wallet);

// 🔹 Ensure necessary environment variables exist
if (!process.env.GOOGLE_DRIVE_FOLDER_ID || !process.env.ALCHEMY_SEPOLIA_URL || !process.env.PRIVATE_KEY || !process.env.CONTRACT_ADDRESS) {
  console.error("🚨 ERROR: Missing required environment variables.");
  process.exit(1);
}

/**
 * 🔹 Upload Route
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "❌ No file uploaded" });
  }

  // 🔹 Check Google Drive Folder ID
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    return res.status(500).json({ error: "❌ Google Drive Folder ID is missing in .env" });
  }

  try {
    console.log("🚀 Processing file:", req.file.originalname);

    // 🔹 Calculate SHA-256 File Hash
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    console.log("🔹 File Hash (SHA256):", fileHash);

    // 🔹 Upload file to Google Drive
    const fileMetadata = {
      name: req.file.originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    };

    const driveResponse = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id, webViewLink",
    });

    const fileId = driveResponse.data.id;
    if (!fileId) {
      throw new Error("❌ Google Drive upload failed!");
    }

    console.log("✅ File uploaded to Google Drive. File ID:", fileId);

    // 🔹 Set file permission to make it public
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    // 🔹 Fetch the public link
    const driveFile = await drive.files.get({
      fileId,
      fields: "id, webViewLink",
    });

    const fileUrl = driveFile.data.webViewLink;
    if (!fileUrl) {
      throw new Error("❌ Failed to generate file URL");
    }

    console.log("✅ File URL:", fileUrl);

    // 🔹 Insert into MySQL
    await db.promise().query(
      "INSERT INTO files (filename, file_url, file_hash) VALUES (?, ?, ?)",
      [req.file.originalname, fileUrl, fileHash]
    );

    console.log("✅ File entry added to database");

    // 🔹 Delete temp file after successful upload
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) console.error("⚠️ Error deleting temp file:", unlinkErr);
    });

    // ✅ Register File on Blockchain
    let txHash = "N/A"; // Default value in case blockchain fails
    try {
      console.log("⛓️ Registering file on Ethereum...");

      // 🔹 Generate Digital Signature
      const signature = await wallet.signMessage(fileHash);
      console.log("🔏 Digital Signature:", signature);

      // 🔹 Store File Hash on Ethereum
      const tx = await contract.storeFileHash(fileHash, signature);
      console.log("📜 Transaction Sent:", tx.hash);
      await tx.wait();
      console.log("✅ Transaction Mined:", tx.hash);

      txHash = tx.hash;
    } catch (blockchainError) {
      if (blockchainError.code === "INSUFFICIENT_FUNDS") {
        console.error("🚨 Blockchain Error: Not enough ETH in wallet!");
      } else {
        console.error("🚨 Blockchain Error:", blockchainError);
      }
    }

    res.json({
      message: "✅ File uploaded successfully!",
      downloadLink: fileUrl,
      transactionHash: txHash,
    });
  } catch (error) {
    console.error("🚨 Upload Error:", error);

    // 🔹 Cleanup temp file in case of error
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: error.message || "Server error" });
  }
});

module.exports = router;

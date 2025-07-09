import {
  AccountBalanceWallet,
  ContentCopy,
  Visibility,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import axios from "axios";
import { BrowserProvider, ethers } from "ethers";
import { motion } from "framer-motion";
import React, { useState } from "react";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [downloadLink, setDownloadLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [account, setAccount] = useState("");

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const connectWallet = async () => {
    if (!window.ethereum) {
      if (isMobile) {
        window.location.href =
          "https://metamask.app.link/dapp/" + window.location.host;
      } else {
        setError("❌ MetaMask is not installed!");
      }
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      setError("");
    } catch (err) {
      setError("❌ MetaMask connection failed! Please try again.");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError("");
    setDownloadLink(""); // Clear old link on new selection
  };

  const uploadFile = async () => {
    if (!file) {
      setError("⚠️ Please select a file to upload.");
      return;
    }
    if (!account) {
      setError("⚠️ Connect MetaMask before uploading.");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setLoading(true);
      setProgress(0);
      setError("");

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const fileBuffer = new Uint8Array(reader.result);
          const fileHash = ethers.keccak256(fileBuffer);

          const signature = await signer.signMessage(fileHash);
          console.log("User Signature:", signature);

          const formData = new FormData();
          formData.append("file", file);
          formData.append("walletAddress", account);
          formData.append("signature", signature);
          formData.append("hash", fileHash);

          const API_URL =
            process.env.REACT_APP_API_URL || "http://localhost:4000";

          const res = await axios.post(`${API_URL}/api/files/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setProgress(percent);
            },
          });

          if (!res.data.downloadLink) {
            throw new Error("Download link is missing in the response.");
          }

          setDownloadLink(res.data.downloadLink);
          setFileName("");
          setFile(null);
        } catch (uploadErr) {
          setError(
            uploadErr.response?.data?.error ||
              "❌ Upload failed. Please try again."
          );
          console.error("Upload error:", uploadErr);
        } finally {
          setLoading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError("❌ Upload preparation failed. Try again.");
      console.error("Outer error:", err);
      setLoading(false);
    }
  };

  return (
    <Box className="upload-container">
      <motion.div whileTap={{ scale: 0.9 }}>
        <Button
          variant="contained"
          fullWidth
          className="wallet-btn"
          onClick={connectWallet}
          startIcon={<AccountBalanceWallet />}
        >
          {account
            ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
            : "Connect MetaMask"}
        </Button>
      </motion.div>

      <Typography variant="h5" className="title">
        🔒 Secured File Upload
      </Typography>

      <input
        id="file-input"
        type="file"
        onChange={handleFileChange}
        className="file-input"
        style={{ display: "none" }}
      />
      <Button
        variant="outlined"
        fullWidth
        component="label"
        htmlFor="file-input"
        className="file-upload-btn"
      >
        📁 Choose File
      </Button>

      {fileName && (
        <Typography className="selected-file">📂 {fileName}</Typography>
      )}

      <motion.div whileTap={{ scale: 0.9 }}>
        <Button
          variant="contained"
          fullWidth
          className="upload-btn"
          onClick={uploadFile}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: "white" }} />
          ) : (
            "⬆️ Upload"
          )}
        </Button>
      </motion.div>

      {loading && (
        <LinearProgress
          className="progress-bar"
          variant="determinate"
          value={progress}
        />
      )}

      {error && <Typography className="error-text">{error}</Typography>}

      {downloadLink && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="link-section"
        >
          <Typography className="success-text">
            ✅ File uploaded successfully!
          </Typography>

          <motion.div whileHover={{ scale: 1.1 }}>
            <Button
              variant="contained"
              className="view-btn"
              fullWidth
              startIcon={<Visibility />}
              onClick={() => window.open(downloadLink, "_blank")}
            >
              🔗 View File
            </Button>
          </motion.div>

          <Box className="link-container">
            <TextField
              value={downloadLink}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <Tooltip title="Copy to clipboard">
              <IconButton
                onClick={() => navigator.clipboard.writeText(downloadLink)}
              >
                <ContentCopy />
              </IconButton>
            </Tooltip>
          </Box>
        </motion.div>
      )}
    </Box>
  );
};

export default FileUpload;

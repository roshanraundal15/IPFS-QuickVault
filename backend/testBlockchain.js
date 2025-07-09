require("dotenv").config();
const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

// ✅ Load Environment Variables
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// ✅ Define Correct Contract Path
const contractPath = path.join(__dirname, "../blockchain/artifacts/contracts/FileStorage.sol/FileStorage.json");

// ✅ Load Smart Contract ABI
if (!fs.existsSync(contractPath)) {
  console.error("🚨 ERROR: Smart contract ABI not found. Make sure Hardhat compiled it!");
  process.exit(1);
}

const contractABI = require(contractPath);
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, contractABI.abi, wallet);

// ✅ Function to verify if file exists
async function verifyFileExists(fileHash) {
  try {
    console.log("🔍 Checking if file exists on blockchain...");
    const [owner, exists] = await contract.verifyFile(fileHash);
    if (!exists) {
      console.log("❌ File hash not found on blockchain!");
      return false;
    }
    console.log(`✅ File exists. Owner: ${owner}`);
    return true;
  } catch (error) {
    console.error("🚨 Error verifying file:", error);
    return false;
  }
}

// ✅ Function to retrieve file details
async function getFileDetails(fileHash) {
  try {
    console.log("🔍 Retrieving file details from blockchain...");

    // 🔹 Check if file exists before fetching details
    const exists = await verifyFileExists(fileHash);
    if (!exists) return;

    const [owner, signature] = await contract.getFileDetails(fileHash);
    console.log(`✅ File Owner: ${owner}`);
    console.log(`✅ File Signature: ${ethers.utils.hexlify(signature)}`);
  } catch (error) {
    console.error("🚨 Error retrieving file details:", error);
  }
}

// Run the function
(async () => {
  const fileHash = "3ac47780978d15fe2e93b3a734adb0512c9a9d9557cd15761fda5c0982ee4916";
  await getFileDetails(fileHash);
})();

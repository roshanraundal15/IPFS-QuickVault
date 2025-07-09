require("dotenv").config({ path: "./.env" });  // Explicitly specify the .env file path

const { ethers } = require("ethers");
const contractABI = require("./artifacts/contracts/FileStorage.sol/FileStorage.json").abi;

// Validate Environment Variables
if (!process.env.BLOCKCHAIN_RPC_URL || !process.env.CONTRACT_ADDRESS) {
    console.error("🚨 Missing environment variables. Check .env file.");
    process.exit(1);
}

// Connect to Hardhat Network
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);

async function test() {
    try {
        console.log("📌 Checking contract functions...");
        if (!contract || !contract.functions) {
            throw new Error("Contract instance is not initialized correctly.");
        }

        console.log("✅ Available contract functions:", Object.keys(contract.functions));

        console.log("🔍 Retrieving file details from blockchain...");
        const fileDetails = await contract.getFileDetails("your-file-hash-here");
        console.log("✅ File Details:", fileDetails);
    } catch (err) {
        console.error("🚨 Error:", err.message);
    }
}

test();

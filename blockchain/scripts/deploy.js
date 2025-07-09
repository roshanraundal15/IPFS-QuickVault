const hre = require("hardhat");

async function main() {
  const provider = new hre.ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY, provider); // Explicitly set signer

  console.log(`Deploying contract with the account: ${wallet.address}`);

  const FileStorage = await hre.ethers.getContractFactory("FileStorage", wallet);
  const fileStorage = await FileStorage.deploy();

  console.log(`Transaction hash: ${fileStorage.deploymentTransaction().hash}`);

  await fileStorage.waitForDeployment();

  console.log(`✅ Contract deployed to: ${await fileStorage.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

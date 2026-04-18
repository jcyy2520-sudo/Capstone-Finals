const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy ProcurementRegistry
  const ProcurementRegistry = await hre.ethers.getContractFactory("ProcurementRegistry");
  const registry = await ProcurementRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("ProcurementRegistry deployed to:", registryAddress);

  // Deploy BidManager
  const BidManager = await hre.ethers.getContractFactory("BidManager");
  const bidManager = await BidManager.deploy();
  await bidManager.waitForDeployment();
  const bidManagerAddress = await bidManager.getAddress();
  console.log("BidManager deployed to:", bidManagerAddress);

  // Deploy PaymentTracker
  const PaymentTracker = await hre.ethers.getContractFactory("PaymentTracker");
  const paymentTracker = await PaymentTracker.deploy();
  await paymentTracker.waitForDeployment();
  const paymentTrackerAddress = await paymentTracker.getAddress();
  console.log("PaymentTracker deployed to:", paymentTrackerAddress);

  // Summary
  console.log("\n── Deployment Summary ──");
  console.log("ProcurementRegistry:", registryAddress);
  console.log("BidManager:         ", bidManagerAddress);
  console.log("PaymentTracker:     ", paymentTrackerAddress);
  console.log("\nUpdate your .env with these addresses.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

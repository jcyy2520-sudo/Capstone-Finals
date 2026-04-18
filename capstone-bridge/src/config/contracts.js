const fs = require("fs");
const path = require("path");

const ARTIFACTS_DIR = path.resolve(__dirname, "../../../capstone-blockchain/artifacts/contracts");

function loadAbi(contractName) {
  const artifactPath = path.join(ARTIFACTS_DIR, `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Contract artifact not found: ${artifactPath}. Run 'npx hardhat compile' in capstone-blockchain/`);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  return artifact.abi;
}

module.exports = {
  ProcurementRegistry: { abi: loadAbi("ProcurementRegistry") },
  BidManager: { abi: loadAbi("BidManager") },
  PaymentTracker: { abi: loadAbi("PaymentTracker") },
};

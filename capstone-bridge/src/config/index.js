require("dotenv").config();

module.exports = {
  port: parseInt(process.env.BRIDGE_PORT, 10) || 3001,
  apiKey: process.env.BRIDGE_API_KEY || "",
  ethereum: {
    rpcUrl: process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545",
    privateKey: process.env.DEPLOYER_PRIVATE_KEY || "",
  },
  contracts: {
    procurementRegistry: process.env.PROCUREMENT_REGISTRY_ADDRESS || "",
    bidManager: process.env.BID_MANAGER_ADDRESS || "",
    paymentTracker: process.env.PAYMENT_TRACKER_ADDRESS || "",
  },
  webhook: {
    url: process.env.LARAVEL_WEBHOOK_URL || "http://127.0.0.1:8000/api/internal/blockchain-webhook",
    key: process.env.LARAVEL_WEBHOOK_KEY || "",
  },
};

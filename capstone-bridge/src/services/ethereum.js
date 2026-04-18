const { ethers } = require("ethers");
const config = require("../config");
const contractDefs = require("../config/contracts");

let provider;
let signer;
let procurementRegistry;
let bidManager;
let paymentTracker;

/**
 * Initialize the ethers.js provider, signer, and contract instances.
 * Called once at server startup.
 */
function initialize() {
  provider = new ethers.JsonRpcProvider(config.ethereum.rpcUrl);

  if (config.ethereum.privateKey) {
    signer = new ethers.Wallet(config.ethereum.privateKey, provider);
  }

  if (config.contracts.procurementRegistry && signer) {
    procurementRegistry = new ethers.Contract(
      config.contracts.procurementRegistry,
      contractDefs.ProcurementRegistry.abi,
      signer
    );
  }

  if (config.contracts.bidManager && signer) {
    bidManager = new ethers.Contract(
      config.contracts.bidManager,
      contractDefs.BidManager.abi,
      signer
    );
  }

  if (config.contracts.paymentTracker && signer) {
    paymentTracker = new ethers.Contract(
      config.contracts.paymentTracker,
      contractDefs.PaymentTracker.abi,
      signer
    );
  }

  console.log("[ethereum] Provider connected to", config.ethereum.rpcUrl);
  if (signer) console.log("[ethereum] Signer address:", signer.address);
  if (procurementRegistry) console.log("[ethereum] ProcurementRegistry loaded");
  if (bidManager) console.log("[ethereum] BidManager loaded");
  if (paymentTracker) console.log("[ethereum] PaymentTracker loaded");
}

function getProvider() { return provider; }
function getSigner() { return signer; }
function getRegistry() { return procurementRegistry; }
function getBidManager() { return bidManager; }
function getPaymentTracker() { return paymentTracker; }

module.exports = {
  initialize,
  getProvider,
  getSigner,
  getRegistry,
  getBidManager,
  getPaymentTracker,
};

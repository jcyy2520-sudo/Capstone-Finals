const { Router } = require("express");
const { ethers } = require("ethers");
const { getPaymentTracker } = require("../services/ethereum");

const router = Router();

/**
 * POST /api/payment/register-contract
 * Body: { contractId, procurementId, vendorAddress, totalAmount }
 */
router.post("/register-contract", async (req, res) => {
  try {
    const { contractId, procurementId, vendorAddress, totalAmount } = req.body;
    if (!contractId || !procurementId || !vendorAddress || !totalAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tracker = getPaymentTracker();
    if (!tracker) return res.status(503).json({ error: "PaymentTracker contract not configured" });

    const cId = ethers.keccak256(ethers.toUtf8Bytes(String(contractId)));
    const pId = ethers.keccak256(ethers.toUtf8Bytes(String(procurementId)));

    const tx = await tracker.registerContract(
      cId, pId, vendorAddress, ethers.parseEther(String(totalAmount))
    );
    const receipt = await tx.wait();

    res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (err) {
    console.error("[payment/register-contract]", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payment/add-milestone
 * Body: { contractId, description, amount }
 */
router.post("/add-milestone", async (req, res) => {
  try {
    const { contractId, description, amount } = req.body;
    if (!contractId || !description || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tracker = getPaymentTracker();
    if (!tracker) return res.status(503).json({ error: "PaymentTracker contract not configured" });

    const cId = ethers.keccak256(ethers.toUtf8Bytes(String(contractId)));
    const tx = await tracker.addMilestone(cId, description, ethers.parseEther(String(amount)));
    const receipt = await tx.wait();

    res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (err) {
    console.error("[payment/add-milestone]", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payment/record
 * Body: { contractId, milestoneIndex, amount }
 */
router.post("/record", async (req, res) => {
  try {
    const { contractId, milestoneIndex, amount } = req.body;
    if (!contractId || milestoneIndex === undefined || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tracker = getPaymentTracker();
    if (!tracker) return res.status(503).json({ error: "PaymentTracker contract not configured" });

    const cId = ethers.keccak256(ethers.toUtf8Bytes(String(contractId)));
    const tx = await tracker.recordPayment(cId, Number(milestoneIndex), ethers.parseEther(String(amount)));
    const receipt = await tx.wait();

    res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (err) {
    console.error("[payment/record]", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/payment/status
 * Query: { contractId }
 */
router.get("/status", async (req, res) => {
  try {
    const { contractId } = req.query;
    if (!contractId) return res.status(400).json({ error: "Missing contractId query param" });

    const tracker = getPaymentTracker();
    if (!tracker) return res.status(503).json({ error: "PaymentTracker contract not configured" });

    const cId = ethers.keccak256(ethers.toUtf8Bytes(String(contractId)));
    const [total, paid, completed] = await tracker.getContractStatus(cId);

    res.json({
      totalAmount: ethers.formatEther(total),
      totalPaid: ethers.formatEther(paid),
      completed,
    });
  } catch (err) {
    console.error("[payment/status]", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

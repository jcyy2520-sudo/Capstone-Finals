const { Router } = require("express");
const { ethers } = require("ethers");
const { getBidManager } = require("../services/ethereum");

const router = Router();

/**
 * POST /api/bidding/open
 * Body: { procurementId, abc, deadline }
 */
router.post("/open", async (req, res) => {
  try {
    const { procurementId, abc, deadline } = req.body;
    if (!procurementId || !abc || !deadline) {
      return res.status(400).json({ error: "Missing required fields: procurementId, abc, deadline" });
    }

    const mgr = getBidManager();
    if (!mgr) return res.status(503).json({ error: "BidManager contract not configured" });

    const id = ethers.keccak256(ethers.toUtf8Bytes(String(procurementId)));
    const tx = await mgr.openBidding(id, ethers.parseEther(String(abc)), Number(deadline));
    const receipt = await tx.wait();

    res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (err) {
    console.error("[bidding/open]", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/bidding/submit-sealed
 * Body: { procurementId, commitHash, bidderAddress }
 * Note: The bridge submits on behalf of the bidder (bridge is the contract owner).
 *       For the commit-reveal scheme, the bidder address is tracked off-chain.
 *       In this simplified version, the bridge wallet submits sealed bids using
 *       unique addresses derived per vendor. For a capstone, we use a simpler
 *       approach: the bridge submits with its own address and tracks vendor mapping.
 */
router.post("/submit-sealed", async (req, res) => {
  try {
    const { procurementId, commitHash } = req.body;
    if (!procurementId || !commitHash) {
      return res.status(400).json({ error: "Missing required fields: procurementId, commitHash" });
    }

    const mgr = getBidManager();
    if (!mgr) return res.status(503).json({ error: "BidManager contract not configured" });

    const id = ethers.keccak256(ethers.toUtf8Bytes(String(procurementId)));
    const hash = commitHash.startsWith("0x") ? commitHash : `0x${commitHash}`;

    const tx = await mgr.submitSealedBid(id, hash);
    const receipt = await tx.wait();

    res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (err) {
    console.error("[bidding/submit-sealed]", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/bidding/close
 * Body: { procurementId }
 */
router.post("/close", async (req, res) => {
  try {
    const { procurementId } = req.body;
    if (!procurementId) {
      return res.status(400).json({ error: "Missing required field: procurementId" });
    }

    const mgr = getBidManager();
    if (!mgr) return res.status(503).json({ error: "BidManager contract not configured" });

    const id = ethers.keccak256(ethers.toUtf8Bytes(String(procurementId)));
    const tx = await mgr.closeBidding(id);
    const receipt = await tx.wait();

    res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (err) {
    console.error("[bidding/close]", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/bidding/reveal
 * Body: { procurementId, bidderAddress, amount, salt }
 */
router.post("/reveal", async (req, res) => {
  try {
    const { procurementId, bidderAddress, amount, salt } = req.body;
    if (!procurementId || !bidderAddress || !amount || !salt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const mgr = getBidManager();
    if (!mgr) return res.status(503).json({ error: "BidManager contract not configured" });

    const id = ethers.keccak256(ethers.toUtf8Bytes(String(procurementId)));
    const saltBytes = salt.startsWith("0x") ? salt : `0x${salt}`;

    const tx = await mgr.revealBid(id, bidderAddress, ethers.parseEther(String(amount)), saltBytes);
    const receipt = await tx.wait();

    res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (err) {
    console.error("[bidding/reveal]", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/bidding/finalize
 * Body: { procurementId }
 */
router.post("/finalize", async (req, res) => {
  try {
    const { procurementId } = req.body;
    const mgr = getBidManager();
    if (!mgr) return res.status(503).json({ error: "BidManager contract not configured" });

    const id = ethers.keccak256(ethers.toUtf8Bytes(String(procurementId)));
    const tx = await mgr.finalizeReveals(id);
    const receipt = await tx.wait();

    const [winner, winAmount] = await mgr.getLowestCompliantBid(id);

    res.json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      lowestBidder: winner,
      lowestAmount: ethers.formatEther(winAmount),
    });
  } catch (err) {
    console.error("[bidding/finalize]", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/bidding/lowest
 * Query: { procurementId }
 */
router.get("/lowest", async (req, res) => {
  try {
    const { procurementId } = req.query;
    const mgr = getBidManager();
    if (!mgr) return res.status(503).json({ error: "BidManager contract not configured" });

    const id = ethers.keccak256(ethers.toUtf8Bytes(String(procurementId)));
    const [winner, amount] = await mgr.getLowestCompliantBid(id);

    res.json({
      lowestBidder: winner,
      lowestAmount: ethers.formatEther(amount),
      hasWinner: winner !== ethers.ZeroAddress,
    });
  } catch (err) {
    console.error("[bidding/lowest]", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

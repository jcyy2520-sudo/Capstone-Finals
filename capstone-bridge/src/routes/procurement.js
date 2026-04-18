const { Router } = require("express");
const { ethers } = require("ethers");
const { getRegistry } = require("../services/ethereum");

const router = Router();

/**
 * POST /api/procurement/register
 * Body: { procurementId, title, abc }
 */
router.post("/register", async (req, res) => {
  try {
    const { procurementId, title, abc } = req.body;
    if (!procurementId || !title || !abc) {
      return res.status(400).json({ error: "Missing required fields: procurementId, title, abc" });
    }

    const registry = getRegistry();
    if (!registry) return res.status(503).json({ error: "ProcurementRegistry contract not configured" });

    const id = ethers.keccak256(ethers.toUtf8Bytes(String(procurementId)));
    const tx = await registry.registerProcurement(id, title, ethers.parseEther(String(abc)));
    const receipt = await tx.wait();

    res.json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      procurementIdHash: id,
    });
  } catch (err) {
    console.error("[procurement/register]", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/procurement/anchor-event
 * Body: { procurementId, eventHash, eventType }
 * eventType: 0=ITB_POSTED, 1=BID_SUBMITTED, 2=BID_OPENING_COMPLETED,
 *            3=NOA_ISSUED, 4=CONTRACT_SIGNED, 5=PAYMENT_RECORDED, 6=DOCUMENT_HASH_MISMATCH
 */
router.post("/anchor-event", async (req, res) => {
  try {
    const { procurementId, eventHash, eventType } = req.body;
    if (!procurementId || !eventHash || eventType === undefined) {
      return res.status(400).json({ error: "Missing required fields: procurementId, eventHash, eventType" });
    }

    const registry = getRegistry();
    if (!registry) return res.status(503).json({ error: "ProcurementRegistry contract not configured" });

    const id = ethers.keccak256(ethers.toUtf8Bytes(String(procurementId)));
    const hash = eventHash.startsWith("0x") ? eventHash : `0x${eventHash}`;

    const tx = await registry.anchorEvent(id, hash, Number(eventType));
    const receipt = await tx.wait();

    res.json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err) {
    console.error("[procurement/anchor-event]", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/procurement/verify
 * Query: { procurementId, eventHash }
 */
router.get("/verify", async (req, res) => {
  try {
    const { procurementId, eventHash } = req.query;
    if (!procurementId || !eventHash) {
      return res.status(400).json({ error: "Missing required query params: procurementId, eventHash" });
    }

    const registry = getRegistry();
    if (!registry) return res.status(503).json({ error: "ProcurementRegistry contract not configured" });

    const id = ethers.keccak256(ethers.toUtf8Bytes(String(procurementId)));
    const hash = eventHash.startsWith("0x") ? eventHash : `0x${eventHash}`;

    const verified = await registry.verifyEvent(id, hash);
    const detail = await registry.getEventDetail(id, hash);

    res.json({
      verified,
      eventType: Number(detail.eventType),
      anchoredAt: Number(detail.anchoredAt),
    });
  } catch (err) {
    console.error("[procurement/verify]", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require("express");
const cors = require("cors");
const config = require("./config");
const auth = require("./middleware/auth");
const ethereum = require("./services/ethereum");
const { startListening } = require("./services/eventListener");

const procurementRoutes = require("./routes/procurement");
const biddingRoutes = require("./routes/bidding");
const paymentRoutes = require("./routes/payment");

const app = express();

// Middleware
app.use(cors({ origin: "http://127.0.0.1:8000" }));
app.use(express.json());

// Health check (no auth required)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Transaction verification (no auth — used by public transparency page)
app.get("/api/verify/:txHash", async (req, res) => {
  try {
    const provider = ethereum.getProvider();
    const receipt = await provider.getTransactionReceipt(req.params.txHash);
    if (!receipt) return res.status(404).json({ error: "Transaction not found" });

    res.json({
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? "confirmed" : "failed",
      gasUsed: receipt.gasUsed.toString(),
      from: receipt.from,
      to: receipt.to,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Authenticated API routes
app.use("/api/procurement", auth, procurementRoutes);
app.use("/api/bidding", auth, biddingRoutes);
app.use("/api/payment", auth, paymentRoutes);

// Initialize Ethereum and start server
try {
  ethereum.initialize();
} catch (err) {
  console.warn("[startup] Ethereum initialization skipped:", err.message);
  console.warn("[startup] Bridge will start but contract calls will fail until contracts are deployed.");
}

app.listen(config.port, () => {
  console.log(`[bridge] ProcureSeal Ethereum Bridge running on port ${config.port}`);

  // Start listening for on-chain events (non-blocking)
  try {
    startListening();
  } catch (err) {
    console.warn("[startup] Event listener skipped:", err.message);
  }
});

module.exports = app;

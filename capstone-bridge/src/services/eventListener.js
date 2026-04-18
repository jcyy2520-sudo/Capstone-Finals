const config = require("../config");
const { getRegistry, getBidManager, getPaymentTracker } = require("./ethereum");

/**
 * Listen for on-chain events emitted by our contracts and post
 * webhook notifications to the Laravel backend so it can update
 * its ethereum_transactions table with confirmed status.
 */
function startListening() {
  const registry = getRegistry();
  const bidMgr = getBidManager();
  const tracker = getPaymentTracker();

  if (registry) {
    registry.on("ProcurementRegistered", async (id, title, abc, timestamp, event) => {
      await postWebhook("ProcurementRegistered", {
        procurementId: id,
        title,
        abc: abc.toString(),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });
    });

    registry.on("EventAnchored", async (procurementId, eventHash, eventType, timestamp, event) => {
      await postWebhook("EventAnchored", {
        procurementId,
        eventHash,
        eventType: Number(eventType),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });
    });
  }

  if (bidMgr) {
    bidMgr.on("BiddingOpened", async (procurementId, abc, deadline, event) => {
      await postWebhook("BiddingOpened", {
        procurementId,
        abc: abc.toString(),
        deadline: Number(deadline),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });
    });

    bidMgr.on("BidRevealed", async (procurementId, bidder, amount, compliant, event) => {
      await postWebhook("BidRevealed", {
        procurementId,
        bidder,
        amount: amount.toString(),
        compliant,
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });
    });
  }

  if (tracker) {
    tracker.on("PaymentRecorded", async (contractId, milestoneIndex, amount, totalPaid, event) => {
      await postWebhook("PaymentRecorded", {
        contractId,
        milestoneIndex: Number(milestoneIndex),
        amount: amount.toString(),
        totalPaid: totalPaid.toString(),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });
    });

    tracker.on("ContractCompleted", async (contractId, totalPaid, event) => {
      await postWebhook("ContractCompleted", {
        contractId,
        totalPaid: totalPaid.toString(),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });
    });
  }

  console.log("[eventListener] Listening for on-chain events...");
}

async function postWebhook(eventName, data) {
  try {
    const response = await fetch(config.webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.webhook.key}`,
      },
      body: JSON.stringify({ event: eventName, data }),
    });

    if (!response.ok) {
      console.error(`[webhook] Failed to post ${eventName}: ${response.status}`);
    }
  } catch (err) {
    console.error(`[webhook] Error posting ${eventName}:`, err.message);
  }
}

module.exports = { startListening };

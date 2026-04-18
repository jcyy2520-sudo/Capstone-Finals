<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\EthereumTransaction;
use App\Models\BlockchainEvent;
use Illuminate\Http\Request;

/**
 * Receives webhook callbacks from the Node.js bridge service
 * when on-chain events are confirmed or transactions complete.
 */
class BlockchainWebhookController extends Controller
{
    public function handle(Request $request)
    {
        // Validate webhook API key
        $webhookKey = config('services.ethereum_bridge.webhook_key');
        $bearerToken = $request->bearerToken();

        if (!$webhookKey || $bearerToken !== $webhookKey) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $event = $request->input('event');
        $data = $request->input('data', []);

        if (!$event || !$data) {
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        // Update the ethereum_transactions record if tx_hash matches
        if (isset($data['txHash'])) {
            $ethTx = EthereumTransaction::where('tx_hash', $data['txHash'])->first();
            if ($ethTx && $ethTx->status === 'pending') {
                $ethTx->markConfirmed(
                    $data['gasUsed'] ?? 0,
                    $data['blockNumber'] ?? 0
                );
            }
        }

        // Update blockchain_event eth_tx_hash if we can match it
        if (isset($data['eventHash'], $data['txHash'])) {
            BlockchainEvent::where('block_hash', $data['eventHash'])
                ->whereNull('eth_tx_hash')
                ->update(['eth_tx_hash' => $data['txHash']]);
        }

        return response()->json(['status' => 'ok']);
    }
}

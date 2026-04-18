<?php

namespace App\Jobs;

use App\Models\BlockchainEvent;
use App\Models\ChainAnchor;
use App\Services\EthereumBridgeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Batch-anchors non-critical blockchain events to Ethereum via a Merkle tree.
 * Runs every 6 hours or when 50+ unanchored events accumulate.
 */
class AnchorBlockchainBatchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function handle(): void
    {
        $unanchored = BlockchainEvent::whereNull('eth_tx_hash')
            ->whereNull('anchor_id')
            ->orderBy('block_number')
            ->limit(100)
            ->get();

        if ($unanchored->isEmpty()) {
            Log::info('[AnchorBatch] No unanchored events to process.');
            return;
        }

        // Build Merkle tree from block hashes
        $leaves = $unanchored->pluck('block_hash')->toArray();
        $merkleRoot = $this->computeMerkleRoot($leaves);

        $blockRangeStart = $unanchored->first()->block_number;
        $blockRangeEnd = $unanchored->last()->block_number;

        // Create anchor record
        $anchor = ChainAnchor::create([
            'merkle_root' => $merkleRoot,
            'block_range_start' => $blockRangeStart,
            'block_range_end' => $blockRangeEnd,
            'event_count' => $unanchored->count(),
            'status' => 'pending',
            'proof_data' => ['leaves' => $leaves],
        ]);

        // Attempt to anchor on-chain
        try {
            $bridge = app(EthereumBridgeService::class);
            $ethTx = $bridge->anchorEvent(
                "BATCH_{$anchor->id}",
                $merkleRoot,
                0 // Generic event type
            );

            if ($ethTx) {
                $anchor->update([
                    'tx_hash' => $ethTx->tx_hash,
                    'status' => 'anchored',
                    'anchored_at' => now(),
                ]);

                // Link events to this anchor
                BlockchainEvent::whereIn('id', $unanchored->pluck('id'))
                    ->update(['anchor_id' => $anchor->id]);

                Log::info("[AnchorBatch] Anchored {$unanchored->count()} events. Merkle root: {$merkleRoot}");
            } else {
                $anchor->update(['status' => 'failed']);
                Log::warning('[AnchorBatch] Bridge returned null — anchor not confirmed.');
            }
        } catch (\Throwable $e) {
            $anchor->update(['status' => 'failed']);
            Log::error("[AnchorBatch] Failed: {$e->getMessage()}");
        }
    }

    /**
     * Compute a simple Merkle root from an array of hex hash strings.
     */
    private function computeMerkleRoot(array $leaves): string
    {
        if (empty($leaves)) return str_repeat('0', 64);
        if (count($leaves) === 1) return $leaves[0];

        // Pad to even
        if (count($leaves) % 2 !== 0) {
            $leaves[] = end($leaves);
        }

        $nextLevel = [];
        for ($i = 0; $i < count($leaves); $i += 2) {
            $pair = [$leaves[$i], $leaves[$i + 1]];
            sort($pair);
            $nextLevel[] = hash('sha256', $pair[0] . $pair[1]);
        }

        return $this->computeMerkleRoot($nextLevel);
    }
}

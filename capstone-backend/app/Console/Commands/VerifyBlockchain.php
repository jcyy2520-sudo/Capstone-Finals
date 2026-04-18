<?php

namespace App\Console\Commands;

use App\Models\BlockchainEvent;
use Illuminate\Console\Command;

class VerifyBlockchain extends Command
{
    protected $signature = 'blockchain:verify {--procurement= : Optional procurement ID to verify}';
    protected $description = 'Independently verify blockchain integrity by checking hash chain links';

    public function handle(): int
    {
        $this->newLine();
        $this->components->info('🔗 Independent Blockchain Chain Verification');
        $this->line('  This tool verifies the chain OUTSIDE the web application.');
        $this->line('  It reads raw database records and checks every hash link.');
        $this->newLine();

        $query = BlockchainEvent::orderBy('block_number');

        if ($procId = $this->option('procurement')) {
            $query->where('procurement_id', $procId);
            $this->line("  Scope: Procurement #{$procId}");
        } else {
            $this->line('  Scope: Entire blockchain');
        }

        $blocks = $query->get();

        if ($blocks->isEmpty()) {
            $this->components->warn('No blockchain records found.');
            return 0;
        }

        $this->line("  Total blocks: {$blocks->count()}");
        $this->newLine();

        $genesisHash = str_repeat('0', 64);
        $passed = 0;
        $failed = 0;
        $issues = [];

        foreach ($blocks as $index => $block) {
            $expectedPreviousHash = $index === 0
                ? $genesisHash
                : $blocks[$index - 1]->block_hash;

            if ($block->previous_hash === $expectedPreviousHash) {
                $passed++;
            } else {
                $failed++;
                $issues[] = [
                    'block' => $block->block_number,
                    'event' => $block->event_type,
                    'expected' => substr($expectedPreviousHash, 0, 16) . '…',
                    'actual' => substr($block->previous_hash, 0, 16) . '…',
                ];
            }
        }

        // Show sample block for manual inspection
        $sampleBlock = $blocks->first();
        $this->components->twoColumnDetail('Sample Block #' . $sampleBlock->block_number, '');
        $this->components->twoColumnDetail('  Event Type', $sampleBlock->event_type);
        $this->components->twoColumnDetail('  Block Hash', $sampleBlock->block_hash);
        $this->components->twoColumnDetail('  Previous Hash', $sampleBlock->previous_hash);
        $this->components->twoColumnDetail('  Recorded At', $sampleBlock->recorded_at->toIso8601String());
        $this->newLine();

        // Results table
        if (!empty($issues)) {
            $this->components->error("CHAIN INTEGRITY BROKEN — {$failed} broken link(s) detected!");
            $this->newLine();
            $this->table(
                ['Block #', 'Event', 'Expected Previous Hash', 'Actual Previous Hash'],
                $issues
            );
        }

        $this->newLine();
        $this->components->twoColumnDetail('Blocks Verified', (string) $blocks->count());
        $this->components->twoColumnDetail('Links Valid', "<fg=green>{$passed}</>");
        $this->components->twoColumnDetail('Links Broken', $failed > 0 ? "<fg=red>{$failed}</>" : '0');
        $this->newLine();

        if ($failed === 0) {
            $this->components->info("✅ CHAIN INTEGRITY VERIFIED — All {$passed} hash links are intact.");
            $this->line('  No tampering detected. Every block correctly references its predecessor.');
        } else {
            $this->components->error("❌ TAMPERING DETECTED — {$failed} block(s) have broken hash links.");
        }

        $this->newLine();
        return $failed > 0 ? 1 : 0;
    }
}

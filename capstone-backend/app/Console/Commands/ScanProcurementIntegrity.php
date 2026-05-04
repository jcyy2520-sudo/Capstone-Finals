<?php

namespace App\Console\Commands;

use App\Models\BlockchainEvent;
use App\Services\ProcurementIntegrityService;
use Illuminate\Console\Command;

class ScanProcurementIntegrity extends Command
{
    protected $signature = 'procureseal:scan-integrity {--procurement= : Optional procurement ID to scan}';
    protected $description = 'Scan blockchain-backed procurement records for live integrity mismatches and send alerts';

    public function __construct(private readonly ProcurementIntegrityService $integrityService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $procurementId = $this->option('procurement');

        if ($procurementId) {
            $report = $this->integrityService->scanProcurement((string) $procurementId);

            $this->line("Procurement #{$report['procurement_id']} checked.");
            $this->line("Trail blocks: {$report['trail_blocks']}");
            $this->line("Mismatches: {$report['mismatch_count']}");
            $this->line('Warning dispatched: ' . ($report['warning_dispatched'] ? 'yes' : 'no'));
            $this->line('Restored dispatched: ' . ($report['restored_dispatched'] ? 'yes' : 'no'));

            return Command::SUCCESS;
        }

        $procurementIds = BlockchainEvent::query()
            ->whereNotNull('procurement_id')
            ->distinct()
            ->orderBy('procurement_id')
            ->pluck('procurement_id');

        $summary = [
            'checked' => 0,
            'warnings' => 0,
            'restored' => 0,
            'mismatched_procurements' => 0,
        ];

        foreach ($procurementIds as $id) {
            $report = $this->integrityService->scanProcurement((string) $id);
            $summary['checked']++;

            if ($report['mismatch_count'] > 0) {
                $summary['mismatched_procurements']++;
            }
            if ($report['warning_dispatched']) {
                $summary['warnings']++;
            }
            if ($report['restored_dispatched']) {
                $summary['restored']++;
            }
        }

        $this->info("Integrity scan complete. {$summary['checked']} procurement(s) checked.");
        $this->line("Mismatched procurements: {$summary['mismatched_procurements']}");
        $this->line("New warnings dispatched: {$summary['warnings']}");
        $this->line("Restoration notices dispatched: {$summary['restored']}");

        return Command::SUCCESS;
    }
}
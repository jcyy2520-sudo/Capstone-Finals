<?php

namespace App\Services;

use App\Models\AppEntry;
use App\Models\AuditLog;
use App\Models\BlockchainEvent;
use Illuminate\Support\Facades\Auth;

/**
 * APP Entry Business Logic Service
 * Handles Annual Procurement Plan entry operations per SRS Section 4.2
 */
class AppEntryService
{
    /**
     * Procurement mode recommendation based on ABC amount.
     * Per RA 12009 IRR thresholds.
     */
    public static function recommendMode(float $abc): array
    {
        if ($abc <= 50000) {
            return ['mode' => 'shopping', 'label' => 'Shopping (≤₱50,000)'];
        } elseif ($abc <= 1000000) {
            return ['mode' => 'small_value', 'label' => 'Small Value Procurement (≤₱1,000,000)'];
        } elseif ($abc <= 2000000) {
            return ['mode' => 'small_value', 'label' => 'Small Value Procurement (≤₱2,000,000)'];
        } else {
            return ['mode' => 'competitive_bidding', 'label' => 'Competitive Bidding (>₱2,000,000)'];
        }
    }

    /**
     * Create a new APP entry (DRAFT status).
     */
    public function create(array $data, int $userId): AppEntry
    {
        $data['created_by'] = $userId;
        $data['status'] = $data['status'] ?? 'draft';

        $entry = AppEntry::create($data);

        AuditLog::log('APP_ENTRY_CREATED', $userId, 'App\Models\AppEntry', $entry->id,
            null, ['project_title' => $entry->project_title], true);

        return $entry->load('department', 'creator');
    }

    /**
        * Submit entry for Department Head endorsement.
     */
    public function submit(AppEntry $entry, int $userId): AppEntry
    {
        if ($entry->status !== 'draft') {
            throw new \InvalidArgumentException('Only draft entries can be submitted.');
        }

        $entry->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        BlockchainEvent::recordEvent(
            'APP_ENTRY_SUBMITTED', $userId,
            'App\Models\AppEntry', $entry->id,
            null,
            ['project_title' => $entry->project_title, 'abc' => $entry->abc]
        );

        AuditLog::log('APP_ENTRY_SUBMITTED', $userId, 'App\Models\AppEntry', $entry->id);

        return $entry->fresh();
    }

    /**
     * Department Head endorses the APP entry.
     */
    public function endorse(AppEntry $entry, int $userId): AppEntry
    {
        if ($entry->status !== 'submitted') {
            throw new \InvalidArgumentException('Only submitted entries can be endorsed.');
        }

        $entry->update([
            'status' => 'pending_budget_certification',
        ]);

        AuditLog::log('APP_ENTRY_ENDORSED', $userId, 'App\Models\AppEntry', $entry->id);

        return $entry->fresh();
    }

    /**
     * Secretariat or Procurement Officer consolidates the endorsed entry.
     */
    public function acceptForConsolidation(AppEntry $entry, int $userId): AppEntry
    {
        if ($entry->status !== 'pending_secretariat_consolidation') {
            throw new \InvalidArgumentException('Only budget-certified entries can be consolidated.');
        }

        $entry->update([
            'status' => 'pending_hope_approval',
        ]);

        AuditLog::log('APP_ENTRY_CONSOLIDATED', $userId, 'App\Models\AppEntry', $entry->id);

        return $entry->fresh();
    }

    /**
     * Budget Officer certifies fund availability.
     */
    public function certifyBudget(AppEntry $entry, int $userId, ?string $remarks = null): AppEntry
    {
        if ($entry->status !== 'pending_budget_certification') {
            throw new \InvalidArgumentException('Entry is not awaiting budget certification.');
        }

        $entry->update([
            'status' => 'pending_secretariat_consolidation',
            'budget_certified_by' => $userId,
            'budget_certified_at' => now(),
        ]);

        BlockchainEvent::recordEvent(
            'APP_BUDGET_CERTIFIED', $userId,
            'App\Models\AppEntry', $entry->id,
            null,
            ['abc' => $entry->abc, 'certified_by' => $userId]
        );

        AuditLog::log('APP_BUDGET_CERTIFIED', $userId, 'App\Models\AppEntry', $entry->id);

        return $entry->fresh();
    }

    /**
     * HOPE approves the APP entry.
     */
    public function approveByHOPE(AppEntry $entry, int $userId, ?string $remarks = null): AppEntry
    {
        if ($entry->status !== 'pending_hope_approval') {
            throw new \InvalidArgumentException('Entry is not awaiting HOPE approval.');
        }

        $entry->update([
            'status' => 'approved',
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);

        BlockchainEvent::recordEvent(
            'APP_ENTRY_APPROVED', $userId,
            'App\Models\AppEntry', $entry->id,
            null,
            ['project_title' => $entry->project_title, 'abc' => $entry->abc, 'approved_by' => $userId]
        );

        AuditLog::log('APP_ENTRY_APPROVED', $userId, 'App\Models\AppEntry', $entry->id);

        return $entry->fresh();
    }

    /**
     * HOPE returns entry for revision.
     */
    public function returnForRevision(AppEntry $entry, int $userId, string $remarks): AppEntry
    {
        if (!in_array($entry->status, ['submitted', 'pending_budget_certification', 'pending_hope_approval'])) {
            throw new \InvalidArgumentException('Entry cannot be returned in its current status.');
        }

        $previousStatus = $entry->status;
        $entry->update([
            'status' => 'returned',
            'return_remarks' => $remarks,
        ]);

        AuditLog::log('APP_ENTRY_RETURNED', $userId, 'App\Models\AppEntry', $entry->id,
            ['status' => $previousStatus], ['status' => 'returned', 'remarks' => $remarks]);

        return $entry->fresh();
    }
}

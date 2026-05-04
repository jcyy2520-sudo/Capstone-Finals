<?php

namespace App\Services;

use App\Models\Award;
use App\Models\AppEntry;
use App\Models\BidPrice;
use App\Models\BidSubmission;
use App\Models\BlockchainEvent;
use App\Models\Contract;
use App\Models\Invitation;
use App\Models\Invoice;
use App\Models\ProcurementNotification;
use App\Models\PurchaseRequisition;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProcurementIntegrityService
{
    public function __construct(
        private readonly NotificationService $notificationService,
        private readonly EthereumBridgeService $ethereumBridgeService,
    ) {
    }

    public function summarizeForPublic(?string $procurementId): array
    {
        $report = $this->inspectProcurement($procurementId);

        if ($report['trail_blocks'] === 0) {
            return [
                'state' => 'pending',
                'label' => 'Verification Pending',
                'message' => 'A public blockchain verification trail is not yet available for this record.',
                'trail_blocks' => 0,
            ];
        }

        if ($report['mismatch_count'] > 0) {
            return [
                'state' => 'warning',
                'label' => 'Integrity Warning',
                'message' => 'The integrity of this record could not be verified. Please contact the procuring entity.',
                'trail_blocks' => $report['trail_blocks'],
            ];
        }

        return [
            'state' => 'verified',
            'label' => 'Blockchain Verified',
            'message' => 'A blockchain audit trail is available for this procurement and no public integrity alerts are currently active.',
            'trail_blocks' => $report['trail_blocks'],
        ];
    }

    public function inspectProcurement(?string $procurementId): array
    {
        $normalizedProcurementId = $this->normalizeProcurementId($procurementId);

        if ($normalizedProcurementId === null) {
            return $this->emptyReport();
        }

        $purchaseRequisition = PurchaseRequisition::query()
            ->with([
                'appEntry',
                'invitation.bidSubmissions',
                'invitation.bidOpening.bidPrices',
            ])
            ->find((int) $normalizedProcurementId);

        if (!$purchaseRequisition) {
            return $this->emptyReport($normalizedProcurementId);
        }

        $trailBlocks = $this->countTrailBlocks($normalizedProcurementId, $purchaseRequisition);
        if ($trailBlocks === 0) {
            return $this->emptyReport($normalizedProcurementId);
        }

        $mismatches = [];

        if ($purchaseRequisition->appEntry) {
            $mismatches = [...$mismatches, ...$this->inspectAppEntry($purchaseRequisition->appEntry)];
        }

        $mismatches = [...$mismatches, ...$this->inspectPurchaseRequisition($purchaseRequisition)];

        $invitation = $purchaseRequisition->invitation;

        if ($invitation) {
            $mismatches = [...$mismatches, ...$this->inspectInvitation($invitation, $purchaseRequisition)];

            foreach ($invitation->bidSubmissions as $bidSubmission) {
                $mismatches = [...$mismatches, ...$this->inspectBidSubmission($bidSubmission)];
            }

            foreach ($invitation->bidOpening?->bidPrices ?? [] as $bidPrice) {
                $mismatches = [...$mismatches, ...$this->inspectBidPrice($bidPrice, $invitation)];
            }
        }

        $award = $invitation
            ? Award::with(['contract.invoices'])
                ->where('invitation_id', $invitation->id)
                ->latest('id')
                ->first()
            : null;

        if ($award) {
            $mismatches = [...$mismatches, ...$this->inspectAward($award, $normalizedProcurementId)];
        }

        $contract = $award?->contract;
        if (!$contract) {
            $contract = Contract::with(['award', 'invoices'])
                ->where('purchase_requisition_id', (int) $normalizedProcurementId)
                ->latest('id')
                ->first();
        } else {
            $contract->loadMissing(['award', 'invoices']);
        }

        if ($contract) {
            $mismatches = [...$mismatches, ...$this->inspectContract($contract, $normalizedProcurementId)];

            foreach ($contract->invoices as $invoice) {
                $mismatches = [...$mismatches, ...$this->inspectInvoice($invoice, $normalizedProcurementId)];
            }
        }

        usort($mismatches, function (array $left, array $right) {
            return [$left['entity_type'], $left['entity_id'], $left['field']] <=> [$right['entity_type'], $right['entity_id'], $right['field']];
        });

        return [
            'procurement_id' => $normalizedProcurementId,
            'trail_blocks' => $trailBlocks,
            'mismatch_count' => count($mismatches),
            'mismatches' => $mismatches,
            'signature' => empty($mismatches)
                ? null
                : hash('sha256', json_encode($mismatches, JSON_UNESCAPED_SLASHES)),
            'checked_at' => now()->toIso8601String(),
        ];
    }

    public function scanProcurement(?string $procurementId): array
    {
        $report = $this->inspectProcurement($procurementId);
        $entityId = (int) ($report['procurement_id'] ?? 0);

        if (!$report['procurement_id'] || $report['trail_blocks'] === 0) {
            return $report + [
                'warning_dispatched' => false,
                'restored_dispatched' => false,
            ];
        }

        $latestMismatchEvent = BlockchainEvent::query()
            ->where('procurement_id', $report['procurement_id'])
            ->where('event_type', BlockchainEvent::DOCUMENT_HASH_MISMATCH)
            ->latest('block_number')
            ->first();

        if ($report['mismatch_count'] > 0) {
            $latestSignature = $latestMismatchEvent?->metadata['signature'] ?? null;
            $restoredAfterLatestMismatch = $latestMismatchEvent
                ? $this->hasRestoredNotificationSince($entityId, $latestMismatchEvent->created_at)
                : false;

            if (!$latestMismatchEvent || $latestSignature !== $report['signature'] || $restoredAfterLatestMismatch) {
                $latestMismatchEvent = $this->recordMismatchEvent($report);
            }

            return $report + [
                'warning_dispatched' => $this->dispatchMismatchNotifications($entityId, $report, $latestMismatchEvent),
                'restored_dispatched' => false,
            ];
        }

        return $report + [
            'warning_dispatched' => false,
            'restored_dispatched' => $latestMismatchEvent
                ? $this->dispatchRestoredNotifications($entityId, $report, $latestMismatchEvent)
                : false,
        ];
    }

    public function listInvestigations(?string $status = null, ?string $search = null): array
    {
        $eventsByProcurement = BlockchainEvent::query()
            ->where('event_type', BlockchainEvent::DOCUMENT_HASH_MISMATCH)
            ->whereNotNull('procurement_id')
            ->latest('block_number')
            ->get()
            ->groupBy(fn (BlockchainEvent $event) => (string) $event->procurement_id);

        $rows = [];

        foreach ($eventsByProcurement as $procurementId => $events) {
            $rows = [
                ...$rows,
                ...$this->buildInvestigationRows((string) $procurementId, $events),
            ];
        }

        if ($status) {
            $rows = array_values(array_filter($rows, fn (array $row) => $row['status'] === $status));
        }

        $needle = trim((string) $search);
        if ($needle !== '') {
            $needle = Str::lower($needle);
            $rows = array_values(array_filter($rows, function (array $row) use ($needle) {
                $haystack = Str::lower(implode(' ', [
                    $row['procurement_id'],
                    $row['entity_type'],
                    $row['affected_table'],
                    $row['field'],
                    $row['label'],
                    $row['expected'],
                    $row['actual'],
                    $row['source_event'],
                    $row['status'],
                ]));

                return str_contains($haystack, $needle);
            }));
        }

        usort($rows, function (array $left, array $right) {
            $leftRank = $left['status'] === 'open' ? 0 : 1;
            $rightRank = $right['status'] === 'open' ? 0 : 1;

            return [$leftRank, $right['last_detected_at'], $left['affected_table'], $left['field']]
                <=> [$rightRank, $left['last_detected_at'], $right['affected_table'], $right['field']];
        });

        return [
            'summary' => [
                'total' => count($rows),
                'open' => count(array_filter($rows, fn (array $row) => $row['status'] === 'open')),
                'resolved' => count(array_filter($rows, fn (array $row) => $row['status'] === 'resolved')),
            ],
            'data' => $rows,
        ];
    }

    private function inspectAppEntry(AppEntry $appEntry): array
    {
        $mismatches = [];

        $projectTitleEvent = $this->findLatestEntityEvent(
            AppEntry::class,
            $appEntry->id,
            ['APP_ENTRY_APPROVED', 'APP_ENTRY_SUBMITTED'],
        );

        if ($projectTitleEvent && array_key_exists('project_title', $projectTitleEvent->metadata ?? [])) {
            $mismatch = $this->compareField(
                'AppEntry',
                $appEntry->id,
                'project_title',
                $projectTitleEvent->metadata['project_title'],
                $appEntry->project_title,
                $projectTitleEvent->event_type,
                false,
            );

            if ($mismatch) {
                $mismatches[] = $mismatch;
            }
        }

        $abcEvent = $this->findLatestEntityEvent(
            AppEntry::class,
            $appEntry->id,
            ['APP_ENTRY_APPROVED', 'APP_BUDGET_CERTIFIED', 'APP_ENTRY_SUBMITTED'],
        );

        if ($abcEvent && array_key_exists('abc', $abcEvent->metadata ?? [])) {
            $mismatch = $this->compareField(
                'AppEntry',
                $appEntry->id,
                'abc',
                $abcEvent->metadata['abc'],
                $appEntry->abc,
                $abcEvent->event_type,
            );

            if ($mismatch) {
                $mismatches[] = $mismatch;
            }
        }

        return $mismatches;
    }

    private function inspectPurchaseRequisition(PurchaseRequisition $purchaseRequisition): array
    {
        $event = $this->findLatestEntityEvent(
            PurchaseRequisition::class,
            $purchaseRequisition->id,
            ['PR_MODE_CONFIRMED', 'PR_ACCEPTED', 'PR_BUDGET_CERTIFIED', 'PR_SUBMITTED'],
        );

        if (!$event) {
            return [];
        }

        $expected = $event->metadata['abc'] ?? $event->metadata['total'] ?? null;
        if ($expected === null) {
            return [];
        }

        $mismatch = $this->compareField(
            'PurchaseRequisition',
            $purchaseRequisition->id,
            'total_value',
            $expected,
            $purchaseRequisition->total_value,
            $event->event_type,
        );

        return $mismatch ? [$mismatch] : [];
    }

    private function inspectInvitation(Invitation $invitation, PurchaseRequisition $purchaseRequisition): array
    {
        $mismatch = $this->compareField(
            'Invitation',
            $invitation->id,
            'abc',
            $purchaseRequisition->total_value,
            $invitation->abc,
            'PR_LINK',
        );

        return $mismatch ? [$mismatch] : [];
    }

    private function inspectBidSubmission(BidSubmission $bidSubmission): array
    {
        $event = $this->findLatestEntityEvent(
            BidSubmission::class,
            $bidSubmission->id,
            [BlockchainEvent::BID_SUBMITTED],
        );

        if (!$event || !array_key_exists('bid_amount', $event->metadata ?? [])) {
            return [];
        }

        $mismatch = $this->compareField(
            'BidSubmission',
            $bidSubmission->id,
            'bid_amount',
            $event->metadata['bid_amount'],
            $bidSubmission->bid_amount,
            $event->event_type,
        );

        return $mismatch ? [$mismatch] : [];
    }

    private function inspectBidPrice(BidPrice $bidPrice, Invitation $invitation): array
    {
        $matchingSubmission = $invitation->bidSubmissions->firstWhere('vendor_id', $bidPrice->vendor_id);
        if (!$matchingSubmission) {
            return [];
        }

        $event = $this->findLatestEntityEvent(
            BidSubmission::class,
            $matchingSubmission->id,
            [BlockchainEvent::BID_SUBMITTED],
        );

        if (!$event || !array_key_exists('bid_amount', $event->metadata ?? [])) {
            return [];
        }

        $mismatch = $this->compareField(
            'BidPrice',
            $bidPrice->id,
            'amount_as_read',
            $event->metadata['bid_amount'],
            $bidPrice->amount_as_read,
            $event->event_type,
        );

        return $mismatch ? [$mismatch] : [];
    }

    private function inspectAward(Award $award, string $procurementId): array
    {
        $event = BlockchainEvent::query()
            ->where('procurement_id', $procurementId)
            ->where('event_type', BlockchainEvent::NOA_ISSUED)
            ->where('entity_id', $award->id)
            ->latest('block_number')
            ->first();

        if (!$event || !array_key_exists('contract_amount', $event->metadata ?? [])) {
            return [];
        }

        $mismatch = $this->compareField(
            'Award',
            $award->id,
            'contract_amount',
            $event->metadata['contract_amount'],
            $award->contract_amount,
            BlockchainEvent::NOA_ISSUED,
        );

        return $mismatch ? [$mismatch] : [];
    }

    private function inspectContract(Contract $contract, string $procurementId): array
    {
        $mismatches = [];

        if ($contract->award && $contract->award->contract_amount !== null) {
            $mismatch = $this->compareField(
                'Contract',
                $contract->id,
                'contract_amount',
                $contract->award->contract_amount,
                $contract->contract_amount,
                'AWARD_LINK',
            );

            if ($mismatch) {
                $mismatches[] = $mismatch;
            }
        }

        $event = BlockchainEvent::query()
            ->where('procurement_id', $procurementId)
            ->where('event_type', BlockchainEvent::CONTRACT_SIGNED)
            ->where(function ($query) use ($contract) {
                $query->where('entity_id', $contract->id)
                    ->orWhereNull('entity_id');
            })
            ->latest('block_number')
            ->first();

        if ($event && array_key_exists('duration_days', $event->metadata ?? [])) {
            $mismatch = $this->compareField(
                'Contract',
                $contract->id,
                'duration_days',
                $event->metadata['duration_days'],
                $contract->duration_days,
                BlockchainEvent::CONTRACT_SIGNED,
                false,
            );

            if ($mismatch) {
                $mismatches[] = $mismatch;
            }
        }

        return $mismatches;
    }

    private function inspectInvoice(Invoice $invoice, string $procurementId): array
    {
        $event = BlockchainEvent::query()
            ->where('procurement_id', $procurementId)
            ->where('entity_id', $invoice->id)
            ->whereIn('event_type', ['INVOICE_PAID', 'INVOICE_SUBMITTED'])
            ->latest('block_number')
            ->first();

        if (!$event || !array_key_exists('amount', $event->metadata ?? [])) {
            return [];
        }

        $mismatch = $this->compareField(
            'Invoice',
            $invoice->id,
            'amount',
            $event->metadata['amount'],
            $invoice->amount,
            $event->event_type,
        );

        return $mismatch ? [$mismatch] : [];
    }

    private function compareField(
        string $entityType,
        int $entityId,
        string $field,
        mixed $expected,
        mixed $actual,
        string $sourceEvent,
        bool $financial = true,
    ): ?array {
        $expectedValue = $this->normalizeValue($expected, $financial);
        $actualValue = $this->normalizeValue($actual, $financial);

        if ($expectedValue === $actualValue) {
            return null;
        }

        return [
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'field' => $field,
            'expected' => $expectedValue,
            'actual' => $actualValue,
            'source_event' => $sourceEvent,
            'financial' => $financial,
            'label' => sprintf(
                '%s #%d %s expected %s but found %s.',
                $entityType,
                $entityId,
                str_replace('_', ' ', $field),
                $expectedValue,
                $actualValue,
            ),
        ];
    }

    private function countTrailBlocks(string $procurementId, PurchaseRequisition $purchaseRequisition): int
    {
        return BlockchainEvent::query()
            ->where('procurement_id', $procurementId)
            ->orWhere(function ($query) use ($purchaseRequisition) {
                $query->where('entity_type', PurchaseRequisition::class)
                    ->where('entity_id', $purchaseRequisition->id);
            })
            ->when($purchaseRequisition->appEntry, function ($query) use ($purchaseRequisition) {
                $query->orWhere(function ($nestedQuery) use ($purchaseRequisition) {
                    $nestedQuery->where('entity_type', AppEntry::class)
                        ->where('entity_id', $purchaseRequisition->appEntry->id);
                });
            })
            ->count();
    }

    private function buildInvestigationRows(string $procurementId, $events): array
    {
        $currentReport = $this->inspectProcurement($procurementId);
        $currentMismatches = $this->keyMismatches($currentReport['mismatches'] ?? []);

        $historicalMismatches = [];

        foreach ($events as $event) {
            $mismatches = $event->metadata['mismatches'] ?? [];
            if (!is_array($mismatches)) {
                continue;
            }

            foreach ($mismatches as $mismatch) {
                if (!is_array($mismatch)) {
                    continue;
                }

                $key = $this->mismatchKey($mismatch);
                $historicalMismatches[$key] ??= $mismatch;
            }
        }

        $keys = array_values(array_unique([
            ...array_keys($historicalMismatches),
            ...array_keys($currentMismatches),
        ]));

        $rows = [];

        foreach ($keys as $key) {
            $historical = $historicalMismatches[$key] ?? null;
            $current = $currentMismatches[$key] ?? null;

            if (!$historical && !$current) {
                continue;
            }

            $firstDetectedAt = $this->findMismatchTimestamp($events, $key, true)
                ?? ($current ? $currentReport['checked_at'] : null);
            $lastDetectedAt = $this->findMismatchTimestamp($events, $key, false)
                ?? ($current ? $currentReport['checked_at'] : null);

            $source = $current ?? $historical;

            $rows[] = [
                'key' => $key,
                'procurement_id' => $procurementId,
                'entity_type' => $source['entity_type'],
                'entity_id' => $source['entity_id'],
                'affected_table' => Str::snake(Str::pluralStudly($source['entity_type'])),
                'field' => $source['field'],
                'expected' => (string) $source['expected'],
                'actual' => (string) $source['actual'],
                'source_event' => $source['source_event'],
                'financial' => (bool) ($source['financial'] ?? false),
                'label' => $source['label'],
                'status' => $current ? 'open' : 'resolved',
                'first_detected_at' => $firstDetectedAt,
                'last_detected_at' => $lastDetectedAt,
                'last_checked_at' => $currentReport['checked_at'] ?? null,
                'trail_blocks' => $currentReport['trail_blocks'] ?? 0,
            ];
        }

        return $rows;
    }

    private function findLatestEntityEvent(string $entityType, int $entityId, array $eventTypes): ?BlockchainEvent
    {
        return BlockchainEvent::query()
            ->where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->whereIn('event_type', $eventTypes)
            ->latest('block_number')
            ->first();
    }

    private function keyMismatches(array $mismatches): array
    {
        $keyed = [];

        foreach ($mismatches as $mismatch) {
            if (!is_array($mismatch)) {
                continue;
            }

            $keyed[$this->mismatchKey($mismatch)] = $mismatch;
        }

        return $keyed;
    }

    private function mismatchKey(array $mismatch): string
    {
        return implode('|', [
            $mismatch['entity_type'] ?? '',
            $mismatch['entity_id'] ?? '',
            $mismatch['field'] ?? '',
        ]);
    }

    private function findMismatchTimestamp($events, string $key, bool $oldest): ?string
    {
        $matchingEvent = $oldest
            ? $events->last(fn (BlockchainEvent $event) => $this->eventContainsMismatchKey($event, $key))
            : $events->first(fn (BlockchainEvent $event) => $this->eventContainsMismatchKey($event, $key));

        $timestamp = $matchingEvent?->recorded_at ?? $matchingEvent?->created_at;

        return $timestamp?->toIso8601String();
    }

    private function eventContainsMismatchKey(BlockchainEvent $event, string $key): bool
    {
        $mismatches = $event->metadata['mismatches'] ?? [];
        if (!is_array($mismatches)) {
            return false;
        }

        foreach ($mismatches as $mismatch) {
            if (is_array($mismatch) && $this->mismatchKey($mismatch) === $key) {
                return true;
            }
        }

        return false;
    }

    private function recordMismatchEvent(array $report): BlockchainEvent
    {
        $event = BlockchainEvent::recordEvent(
            BlockchainEvent::DOCUMENT_HASH_MISMATCH,
            null,
            PurchaseRequisition::class,
            (int) $report['procurement_id'],
            $report['signature'],
            [
                'procurement_id' => $report['procurement_id'],
                'signature' => $report['signature'],
                'mismatch_count' => $report['mismatch_count'],
                'mismatches' => $report['mismatches'],
                'detected_at' => $report['checked_at'],
            ],
        );

        try {
            $this->ethereumBridgeService->anchorEvent(
                $report['procurement_id'],
                $report['signature'],
                6,
                $event->id,
            );
        } catch (\Throwable $exception) {
            Log::warning("[IntegrityScan] Ethereum anchoring skipped: {$exception->getMessage()}");
        }

        return $event;
    }

    private function dispatchMismatchNotifications(int $entityId, array $report, BlockchainEvent $mismatchEvent): bool
    {
        if ($this->hasWarningNotificationSince($entityId, $mismatchEvent->created_at)) {
            return false;
        }

        $recipients = $this->resolveRecipients($report['mismatches']);
        if ($recipients->isEmpty()) {
            return false;
        }

        $count = $report['mismatch_count'];
        $headline = $count === 1
            ? $report['mismatches'][0]['label']
            : $report['mismatches'][0]['label'] . ' ' . ($count - 1) . ' more issue(s) detected.';

        foreach ($recipients as $recipient) {
            $this->notificationService->notify(
                $recipient->id,
                'integrity_warning',
                'Integrity Warning',
                "{$count} integrity mismatch(es) detected for procurement #{$report['procurement_id']}. {$headline}",
                'critical',
                PurchaseRequisition::class,
                $entityId,
                null,
                true,
            );
        }

        return true;
    }

    private function dispatchRestoredNotifications(int $entityId, array $report, BlockchainEvent $mismatchEvent): bool
    {
        if ($this->hasRestoredNotificationSince($entityId, $mismatchEvent->created_at)) {
            return false;
        }

        $previousMismatches = $mismatchEvent->metadata['mismatches'] ?? [];
        $recipients = $this->resolveRecipients(is_array($previousMismatches) ? $previousMismatches : []);
        if ($recipients->isEmpty()) {
            return false;
        }

        foreach ($recipients as $recipient) {
            $this->notificationService->notify(
                $recipient->id,
                'integrity_restored',
                'Integrity Restored',
                "Procurement #{$report['procurement_id']} now matches its trusted blockchain-backed values again.",
                'high',
                PurchaseRequisition::class,
                $entityId,
                null,
                true,
            );
        }

        return true;
    }

    private function resolveRecipients(array $mismatches)
    {
        $roles = [
            Role::SYSTEM_ADMIN,
            Role::INTERNAL_AUDITOR,
            Role::HOPE,
        ];

        if ($this->hasFinancialMismatch($mismatches)) {
            $roles[] = Role::FINANCE_OFFICER;
        }

        return User::query()
            ->with('role')
            ->where('status', 'active')
            ->whereHas('role', fn ($query) => $query->whereIn('name', $roles))
            ->get();
    }

    private function hasFinancialMismatch(array $mismatches): bool
    {
        foreach ($mismatches as $mismatch) {
            if (($mismatch['financial'] ?? false) === true) {
                return true;
            }
        }

        return false;
    }

    private function hasWarningNotificationSince(int $entityId, $since): bool
    {
        return ProcurementNotification::query()
            ->where('type', 'integrity_warning')
            ->where('entity_type', PurchaseRequisition::class)
            ->where('entity_id', $entityId)
            ->where('created_at', '>=', $since)
            ->exists();
    }

    private function hasRestoredNotificationSince(int $entityId, $since): bool
    {
        return ProcurementNotification::query()
            ->where('type', 'integrity_restored')
            ->where('entity_type', PurchaseRequisition::class)
            ->where('entity_id', $entityId)
            ->where('created_at', '>=', $since)
            ->exists();
    }

    private function normalizeProcurementId(?string $procurementId): ?string
    {
        if ($procurementId === null || $procurementId === '') {
            return null;
        }

        return (string) ((int) $procurementId);
    }

    private function normalizeValue(mixed $value, bool $financial): string
    {
        if ($value === null) {
            return 'null';
        }

        if ($financial) {
            return number_format((float) $value, 2, '.', '');
        }

        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        return (string) $value;
    }

    private function emptyReport(?string $procurementId = null): array
    {
        return [
            'procurement_id' => $procurementId,
            'trail_blocks' => 0,
            'mismatch_count' => 0,
            'mismatches' => [],
            'signature' => null,
            'checked_at' => now()->toIso8601String(),
        ];
    }
}
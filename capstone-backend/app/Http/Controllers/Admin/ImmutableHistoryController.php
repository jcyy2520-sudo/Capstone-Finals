<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ImmutableHistoryEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImmutableHistoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ImmutableHistoryEntry::query()->orderByDesc('recorded_at');

        if ($request->filled('table_name')) {
            $query->where('table_name', $request->string('table_name'));
        }

        if ($request->filled('operation')) {
            $query->where('operation', $request->string('operation'));
        }

        if ($request->filled('record_id')) {
            $query->where('record_id', $request->integer('record_id'));
        }

        if ($search = trim((string) $request->input('search', ''))) {
            $like = '%' . $search . '%';

            $query->where(function ($builder) use ($like) {
                $builder->where('table_name', 'like', $like)
                    ->orWhere('operation', 'like', $like)
                    ->orWhere('record_id', 'like', $like)
                    ->orWhere('old_snapshot', 'like', $like)
                    ->orWhere('new_snapshot', 'like', $like);
            });
        }

        $summaryQuery = clone $query;
        $summary = [
            'total' => (clone $summaryQuery)->count(),
            'created' => (clone $summaryQuery)->where('operation', 'created')->count(),
            'updated' => (clone $summaryQuery)->where('operation', 'updated')->count(),
            'deleted' => (clone $summaryQuery)->where('operation', 'deleted')->count(),
        ];

        $entries = $query->paginate($request->integer('per_page', 20));

        return response()->json([
            'data' => $entries->getCollection()->map(fn (ImmutableHistoryEntry $entry) => $this->transformEntry($entry))->values(),
            'meta' => [
                'current_page' => $entries->currentPage(),
                'last_page' => $entries->lastPage(),
                'per_page' => $entries->perPage(),
                'total' => $entries->total(),
                'from' => $entries->firstItem(),
                'to' => $entries->lastItem(),
            ],
            'summary' => $summary,
        ]);
    }

    private function transformEntry(ImmutableHistoryEntry $entry): array
    {
        $oldSnapshot = $entry->old_snapshot ?? [];
        $newSnapshot = $entry->new_snapshot ?? [];
        $latestSnapshot = is_array($newSnapshot) && !empty($newSnapshot) ? $newSnapshot : $oldSnapshot;

        return [
            'id' => $entry->id,
            'table_name' => $entry->table_name,
            'table_label' => $this->tableLabel($entry->table_name),
            'record_id' => $entry->record_id,
            'record_label' => $this->recordLabel($latestSnapshot, $entry->table_name, $entry->record_id),
            'operation' => $entry->operation,
            'changed_fields' => $this->changedFields($oldSnapshot, $newSnapshot, $entry->operation),
            'old_snapshot' => $oldSnapshot,
            'new_snapshot' => $newSnapshot,
            'recorded_at' => optional($entry->recorded_at)->toIso8601String(),
        ];
    }

    private function tableLabel(string $tableName): string
    {
        return match ($tableName) {
            'app_entries' => 'APP Entries',
            'purchase_requisitions' => 'Purchase Requisitions',
            'pr_line_items' => 'PR Line Items',
            'invitations' => 'Invitations',
            'bid_submissions' => 'Bid Submissions',
            'bid_openings' => 'Bid Openings',
            'bid_prices' => 'Bid Prices',
            'bac_resolutions' => 'BAC Resolutions',
            'awards' => 'Awards',
            'contracts' => 'Contracts',
            'invoices' => 'Invoices',
            'blockchain_events' => 'Blockchain Events',
            'audit_logs' => 'Audit Logs',
            'procurement_notifications' => 'Notifications',
            'ethereum_transactions' => 'Ethereum Transactions',
            'chain_anchors' => 'Chain Anchors',
            default => ucwords(str_replace('_', ' ', $tableName)),
        };
    }

    private function recordLabel(array $snapshot, string $tableName, ?int $recordId): string
    {
        $referenceFields = [
            'pr_reference',
            'reference_number',
            'resolution_reference',
            'noa_reference',
            'contract_reference',
            'invoice_number',
            'session_reference',
            'project_title',
            'title',
            'business_name',
            'name',
        ];

        foreach ($referenceFields as $field) {
            $value = $snapshot[$field] ?? null;
            if (is_scalar($value) && trim((string) $value) !== '') {
                return (string) $value;
            }
        }

        return $this->tableLabel($tableName) . ' #' . ($recordId ?? 'N/A');
    }

    private function changedFields(array $oldSnapshot, array $newSnapshot, string $operation): array
    {
        if ($operation === 'created') {
            return array_values(array_keys($newSnapshot));
        }

        if ($operation === 'deleted') {
            return array_values(array_keys($oldSnapshot));
        }

        $keys = array_unique([...array_keys($oldSnapshot), ...array_keys($newSnapshot)]);
        $changed = [];

        foreach ($keys as $key) {
            if (($oldSnapshot[$key] ?? null) !== ($newSnapshot[$key] ?? null)) {
                $changed[] = $key;
            }
        }

        return $changed;
    }
}
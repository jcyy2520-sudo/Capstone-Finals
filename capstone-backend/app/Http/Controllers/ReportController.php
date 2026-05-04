<?php

namespace App\Http\Controllers;

use App\Models\AppEntry;
use App\Models\AuditLog;
use App\Models\Award;
use App\Models\BlockchainEvent;
use App\Models\Contract;
use App\Models\Invitation;
use App\Models\PurchaseRequisition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ReportController extends Controller
{
    private const REPORT_CACHE_TTL_SECONDS = 15;

    /**
     * Procurement summary statistics for observer/auditor dashboards.
     */
    public function summary(): JsonResponse
    {
        return $this->cachedJson('reports:summary', fn () => [
            'total_app_entries' => AppEntry::count(),
            'total_prs' => PurchaseRequisition::count(),
            'active_invitations' => Invitation::where('status', 'posted')->count(),
            'total_awards' => Award::count(),
            'active_contracts' => Contract::where('status', 'active')->count(),
            'total_contracts' => Contract::count(),
            'blockchain_events' => BlockchainEvent::count(),
            'audit_logs_24h' => AuditLog::where('created_at', '>=', now()->subHours(24))->count(),
        ]);
    }

    /**
     * Procurement breakdown by mode.
     */
    public function byMode(): JsonResponse
    {
        return $this->cachedJson('reports:by-mode', function () {
            return Invitation::selectRaw('procurement_mode, COUNT(*) as count')
                ->groupBy('procurement_mode')
                ->orderBy('procurement_mode')
                ->get()
                ->map(fn ($row) => [
                    'procurement_mode' => $row->procurement_mode,
                    'count' => (int) $row->count,
                ])
                ->values()
                ->all();
        });
    }

    /**
     * Procurement breakdown by department (via PRs).
     */
    public function byDepartment(): JsonResponse
    {
        return $this->cachedJson('reports:by-department', function () {
            return PurchaseRequisition::join('departments', 'purchase_requisitions.department_id', '=', 'departments.id')
                ->selectRaw('departments.name as department, COUNT(*) as count')
                ->groupBy('departments.name')
                ->pluck('count', 'department')
                ->all();
        });
    }

    /**
     * Procurement breakdown by status across modules.
     */
    public function byStatus(): JsonResponse
    {
        return $this->cachedJson('reports:by-status', fn () => [
            'prs' => PurchaseRequisition::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->orderBy('status')
                ->get()
                ->map(fn ($row) => ['status' => $row->status, 'count' => (int) $row->count])
                ->values()
                ->all(),
            'invitations' => Invitation::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->orderBy('status')
                ->get()
                ->map(fn ($row) => ['status' => $row->status, 'count' => (int) $row->count])
                ->values()
                ->all(),
            'awards' => Award::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->orderBy('status')
                ->get()
                ->map(fn ($row) => ['status' => $row->status, 'count' => (int) $row->count])
                ->values()
                ->all(),
            'contracts' => Contract::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->orderBy('status')
                ->get()
                ->map(fn ($row) => ['status' => $row->status, 'count' => (int) $row->count])
                ->values()
                ->all(),
        ]);
    }

    /**
     * Timeline compliance — average days per stage.
     */
    public function timelineCompliance(): JsonResponse
    {
        return $this->cachedJson('reports:timeline-compliance', function () {
            $avgPrToInvitation = PurchaseRequisition::where(function ($query) {
                    $query->whereNotNull('accepted_at')
                        ->orWhereNotNull('submitted_at');
                })
                ->whereHas('invitation')
                ->with('invitation')
                ->get()
                ->filter(fn($pr) => $pr->invitation)
                ->avg(function ($pr) {
                    $start = $pr->accepted_at ?? $pr->submitted_at ?? $pr->created_at;

                    return $start?->diffInDays($pr->invitation->created_at) ?? 0;
                });

            $avgInvitationToAward = Award::whereNotNull('created_at')
                ->with('invitation')
                ->get()
                ->filter(fn($a) => $a->invitation)
                ->avg(fn($a) => $a->invitation->created_at->diffInDays($a->created_at));

            $overdueContracts = Contract::where('status', 'active')
                ->whereNotNull('end_date')
                ->where('end_date', '<', now())
                ->count();

            return [
                'avg_days_pr_to_invitation' => round($avgPrToInvitation ?? 0, 1),
                'avg_days_invitation_to_award' => round($avgInvitationToAward ?? 0, 1),
                'overdue_contracts' => $overdueContracts,
                'total_active_contracts' => Contract::where('status', 'active')->count(),
            ];
        });
    }

    /**
     * HOPE performance dashboard stats.
     */
    public function hopePerformance(): JsonResponse
    {
        return $this->cachedJson('reports:hope-performance', function () {
            $pendingApprovals = Invitation::where('status', 'pending_hope_approval')->count()
                + Award::where('status', Award::STATUS_DRAFT)->count();

            $totalAppBudget = AppEntry::where('status', 'approved')->sum('abc');
            $totalContracted = Contract::whereIn('status', ['active', 'completed'])->sum('contract_amount');
            $savings = $totalAppBudget > 0 ? round((($totalAppBudget - $totalContracted) / $totalAppBudget) * 100, 1) : 0;

            $overdueCount = Contract::where('status', 'active')
                ->whereNotNull('end_date')
                ->where('end_date', '<', now())
                ->count();

            $monthlyAwards = Award::where('created_at', '>=', now()->subDays(30))->count();

            return [
                'pending_approvals' => $pendingApprovals,
                'overdue_procurements' => $overdueCount,
                'awards_this_month' => $monthlyAwards,
                'total_app_budget' => $totalAppBudget,
                'total_contracted' => $totalContracted,
                'savings_percentage' => max(0, $savings),
                'active_contracts' => Contract::where('status', 'active')->count(),
                'completed_contracts' => Contract::where('status', 'completed')->count(),
            ];
        });
    }

    /**
     * Read-only procurement register for observer.
     */
    public function procurementRegister(Request $request): JsonResponse
    {
        $filters = $request->only(['page', 'per_page', 'mode', 'status']);
        ksort($filters);

        return $this->cachedJson('reports:procurement-register:' . md5(json_encode($filters)), function () use ($request) {
            $query = Invitation::with(['purchaseRequisition.department', 'award.vendor'])
                ->orderByDesc('created_at');

            if ($request->has('mode')) {
                $query->where('procurement_mode', $request->input('mode'));
            }
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            return $query->paginate($request->input('per_page', 20))->toArray();
        }, 10);
    }

    /**
     * Auditor risk indicators — flagged transactions.
     */
    public function riskIndicators(): JsonResponse
    {
        return $this->cachedJson('reports:risk-indicators', function () {
            $flags = [];

            $nearingDeadline = Contract::where('status', 'active')
                ->whereNotNull('end_date')
                ->whereNotNull('ntp_date')
                ->get()
                ->filter(function ($contract) {
                    $total = $contract->ntp_date->diffInDays($contract->end_date);
                    $elapsed = $contract->ntp_date->diffInDays(now());

                    return $total > 0 && ($elapsed / $total) >= 0.9;
                });

            foreach ($nearingDeadline as $contract) {
                $flags[] = [
                    'type' => 'deadline_risk',
                    'severity' => 'high',
                    'entity_type' => 'Contract',
                    'entity_id' => $contract->id,
                    'reference' => $contract->contract_reference,
                    'message' => "Contract {$contract->contract_reference} is >90% through its duration",
                ];
            }

            $overdueNoa = Award::where('status', 'noa_issued')
                ->whereNotNull('noa_acknowledgment_deadline')
                ->where('noa_acknowledgment_deadline', '<', now())
                ->whereNull('noa_acknowledged_at')
                ->get();

            foreach ($overdueNoa as $award) {
                $flags[] = [
                    'type' => 'noa_overdue',
                    'severity' => 'critical',
                    'entity_type' => 'Award',
                    'entity_id' => $award->id,
                    'reference' => $award->noa_reference,
                    'message' => "NOA {$award->noa_reference} acknowledgment is overdue",
                ];
            }

            $failedBiddings = Invitation::where('status', 'failed')
                ->where('created_at', '>=', now()->subDays(90))
                ->count();

            if ($failedBiddings > 0) {
                $flags[] = [
                    'type' => 'failed_biddings',
                    'severity' => 'medium',
                    'entity_type' => 'Summary',
                    'entity_id' => null,
                    'reference' => null,
                    'message' => "{$failedBiddings} failed bidding(s) in the last 90 days",
                ];
            }

            return [
                'flags' => $flags,
                'total_flags' => count($flags),
                'critical_count' => count(array_filter($flags, fn($flag) => $flag['severity'] === 'critical')),
                'high_count' => count(array_filter($flags, fn($flag) => $flag['severity'] === 'high')),
            ];
        });
    }

    private function cachedJson(string $key, callable $resolver, int $ttlSeconds = self::REPORT_CACHE_TTL_SECONDS): JsonResponse
    {
        $payload = Cache::remember($key, now()->addSeconds($ttlSeconds), $resolver);

        return response()->json($payload);
    }
}

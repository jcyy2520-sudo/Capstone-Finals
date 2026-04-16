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

class ReportController extends Controller
{
    /**
     * Procurement summary statistics for observer/auditor dashboards.
     */
    public function summary(): JsonResponse
    {
        return response()->json([
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
        $byMode = Invitation::selectRaw('procurement_mode, COUNT(*) as count')
            ->groupBy('procurement_mode')
            ->pluck('count', 'procurement_mode');

        return response()->json($byMode);
    }

    /**
     * Procurement breakdown by department (via PRs).
     */
    public function byDepartment(): JsonResponse
    {
        $byDept = PurchaseRequisition::join('departments', 'purchase_requisitions.department_id', '=', 'departments.id')
            ->selectRaw('departments.name as department, COUNT(*) as count')
            ->groupBy('departments.name')
            ->pluck('count', 'department');

        return response()->json($byDept);
    }

    /**
     * Procurement breakdown by status across modules.
     */
    public function byStatus(): JsonResponse
    {
        return response()->json([
            'prs' => PurchaseRequisition::selectRaw('status, COUNT(*) as count')->groupBy('status')->pluck('count', 'status'),
            'invitations' => Invitation::selectRaw('status, COUNT(*) as count')->groupBy('status')->pluck('count', 'status'),
            'awards' => Award::selectRaw('status, COUNT(*) as count')->groupBy('status')->pluck('count', 'status'),
            'contracts' => Contract::selectRaw('status, COUNT(*) as count')->groupBy('status')->pluck('count', 'status'),
        ]);
    }

    /**
     * Timeline compliance — average days per stage.
     */
    public function timelineCompliance(): JsonResponse
    {
        $avgPrToInvitation = PurchaseRequisition::whereNotNull('approved_at')
            ->whereHas('invitation')
            ->with('invitation')
            ->get()
            ->filter(fn($pr) => $pr->invitation)
            ->avg(fn($pr) => $pr->approved_at->diffInDays($pr->invitation->created_at));

        $avgInvitationToAward = Award::whereNotNull('created_at')
            ->with('invitation')
            ->get()
            ->filter(fn($a) => $a->invitation)
            ->avg(fn($a) => $a->invitation->created_at->diffInDays($a->created_at));

        $overdueContracts = Contract::where('status', 'active')
            ->whereNotNull('end_date')
            ->where('end_date', '<', now())
            ->count();

        return response()->json([
            'avg_pr_to_invitation_days' => round($avgPrToInvitation ?? 0, 1),
            'avg_invitation_to_award_days' => round($avgInvitationToAward ?? 0, 1),
            'overdue_contracts' => $overdueContracts,
            'total_active_contracts' => Contract::where('status', 'active')->count(),
        ]);
    }

    /**
     * HOPE performance dashboard stats.
     */
    public function hopePerformance(): JsonResponse
    {
        $pendingApprovals = Invitation::where('status', 'pending_hope_approval')->count()
            + Award::where('status', 'pending_hope_approval')->count();

        $totalAppBudget = AppEntry::where('status', 'approved')->sum('estimated_budget');
        $totalContracted = Contract::whereIn('status', ['active', 'completed'])->sum('contract_amount');
        $savings = $totalAppBudget > 0 ? round((($totalAppBudget - $totalContracted) / $totalAppBudget) * 100, 1) : 0;

        $overdueCount = Contract::where('status', 'active')
            ->whereNotNull('end_date')
            ->where('end_date', '<', now())
            ->count();

        $monthlyAwards = Award::where('created_at', '>=', now()->subDays(30))->count();

        return response()->json([
            'pending_approvals' => $pendingApprovals,
            'overdue_procurements' => $overdueCount,
            'awards_this_month' => $monthlyAwards,
            'total_app_budget' => $totalAppBudget,
            'total_contracted' => $totalContracted,
            'savings_percentage' => max(0, $savings),
            'active_contracts' => Contract::where('status', 'active')->count(),
            'completed_contracts' => Contract::where('status', 'completed')->count(),
        ]);
    }

    /**
     * Read-only procurement register for observer.
     */
    public function procurementRegister(Request $request): JsonResponse
    {
        $query = Invitation::with(['purchaseRequisition.department', 'award.vendor'])
            ->orderByDesc('created_at');

        if ($request->has('mode')) {
            $query->where('procurement_mode', $request->input('mode'));
        }
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $records = $query->paginate($request->input('per_page', 20));

        return response()->json($records);
    }

    /**
     * Auditor risk indicators — flagged transactions.
     */
    public function riskIndicators(): JsonResponse
    {
        $flags = [];

        // Contracts nearing deadline (>90% elapsed)
        $nearingDeadline = Contract::where('status', 'active')
            ->whereNotNull('end_date')
            ->whereNotNull('ntp_date')
            ->get()
            ->filter(function ($c) {
                $total = $c->ntp_date->diffInDays($c->end_date);
                $elapsed = $c->ntp_date->diffInDays(now());
                return $total > 0 && ($elapsed / $total) >= 0.9;
            });

        foreach ($nearingDeadline as $c) {
            $flags[] = [
                'type' => 'deadline_risk',
                'severity' => 'high',
                'entity_type' => 'Contract',
                'entity_id' => $c->id,
                'reference' => $c->contract_reference,
                'message' => "Contract {$c->contract_reference} is >90% through its duration",
            ];
        }

        // Overdue NOA acknowledgments
        $overdueNoa = Award::where('status', 'noa_issued')
            ->whereNotNull('noa_acknowledgment_deadline')
            ->where('noa_acknowledgment_deadline', '<', now())
            ->whereNull('noa_acknowledged_at')
            ->get();

        foreach ($overdueNoa as $a) {
            $flags[] = [
                'type' => 'noa_overdue',
                'severity' => 'critical',
                'entity_type' => 'Award',
                'entity_id' => $a->id,
                'reference' => $a->noa_reference,
                'message' => "NOA {$a->noa_reference} acknowledgment is overdue",
            ];
        }

        // Failed biddings (invitations that failed)
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

        return response()->json([
            'flags' => $flags,
            'total_flags' => count($flags),
            'critical_count' => count(array_filter($flags, fn($f) => $f['severity'] === 'critical')),
            'high_count' => count(array_filter($flags, fn($f) => $f['severity'] === 'high')),
        ]);
    }
}

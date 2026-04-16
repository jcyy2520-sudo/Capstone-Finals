<?php

namespace App\Services;

use App\Models\PurchaseRequisition;
use App\Models\PrLineItem;
use App\Models\AppEntry;
use App\Models\AuditLog;
use App\Models\BlockchainEvent;
use Illuminate\Support\Facades\DB;

/**
 * Purchase Requisition Business Logic Service
 * Per SRS Section 4.3
 */
class PurchaseRequisitionService
{
    /**
     * Generate PR reference number: PR-YEAR-DEPTCODE-SEQUENCE
     */
    public static function generateReferenceNumber(int $departmentId): string
    {
        $year = now()->year;
        $dept = \App\Models\Department::find($departmentId);
        $deptCode = $dept?->code ?? 'GEN';

        $lastSeq = PurchaseRequisition::where('department_id', $departmentId)
            ->whereYear('created_at', $year)
            ->count();

        $seq = str_pad($lastSeq + 1, 4, '0', STR_PAD_LEFT);
        return "PR-{$year}-{$deptCode}-{$seq}";
    }

    /**
     * Create a PR with line items.
     */
    public function create(array $data, array $lineItems, int $userId): PurchaseRequisition
    {
        return DB::transaction(function () use ($data, $lineItems, $userId) {
            $data['pr_reference'] = self::generateReferenceNumber($data['department_id']);
            $data['requester_id'] = $userId;
            $data['status'] = $data['status'] ?? 'draft';

            $pr = PurchaseRequisition::create($data);

            // Create line items
            foreach ($lineItems as $item) {
                $item['purchase_requisition_id'] = $pr->id;
                $item['estimated_unit_cost'] = $item['unit_cost'] ?? 0;
                $item['estimated_total_cost'] = ($item['quantity'] ?? 0) * ($item['estimated_unit_cost']);
                unset($item['unit_cost'], $item['total_cost']);
                PrLineItem::create($item);
            }

            // Recompute PR total
            $pr->recomputeTotal();

            AuditLog::log('PR_CREATED', $userId, 'App\Models\PurchaseRequisition', $pr->id,
                null, ['pr_ref' => $pr->pr_reference], true);

            return $pr->load(['lineItems', 'department', 'requester', 'appEntry']);
        });
    }

    /**
     * Submit PR for Department Head endorsement.
     */
    public function submitForEndorsement(PurchaseRequisition $pr, int $userId): PurchaseRequisition
    {
        if ($pr->status !== 'draft') {
            throw new \InvalidArgumentException('Only draft PRs can be submitted.');
        }

        // Validate linked APP entry is approved
        if ($pr->appEntry && $pr->appEntry->status !== 'approved') {
            throw new \InvalidArgumentException('The linked APP entry must be in approved status.');
        }

        // Validate total doesn't exceed remaining APP budget
        if ($pr->appEntry) {
            $usedBudget = PurchaseRequisition::where('app_entry_id', $pr->app_entry_id)
                ->where('id', '!=', $pr->id)
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->sum('total_value');

            $remaining = $pr->appEntry->abc - $usedBudget;
            if ($pr->total_value > $remaining) {
                throw new \InvalidArgumentException(
                    "PR total (₱" . number_format($pr->total_value, 2) .
                    ") exceeds remaining APP budget (₱" . number_format($remaining, 2) . ")."
                );
            }
        }

        $pr->update([
            'status' => 'pending_dh_endorsement',
            'submitted_at' => now(),
        ]);

        BlockchainEvent::recordEvent(
            'PR_SUBMITTED', $userId,
            'App\Models\PurchaseRequisition', $pr->id,
            null,
            ['pr_ref' => $pr->pr_reference, 'total' => $pr->total_value]
        );

        return $pr->fresh();
    }

    /**
     * Department Head endorses PR.
     */
    public function endorse(PurchaseRequisition $pr, int $userId): PurchaseRequisition
    {
        if ($pr->status !== 'pending_dh_endorsement') {
            throw new \InvalidArgumentException('PR is not awaiting endorsement.');
        }

        $pr->update([
            'status' => 'pending_budget_certification',
            'endorsed_by' => $userId,
            'endorsed_at' => now(),
        ]);

        AuditLog::log('PR_ENDORSED', $userId, 'App\Models\PurchaseRequisition', $pr->id);

        return $pr->fresh();
    }

    /**
     * Budget Officer certifies fund availability.
     */
    public function certifyBudget(PurchaseRequisition $pr, int $userId, ?string $fundSource = null, ?string $accountCode = null): PurchaseRequisition
    {
        if ($pr->status !== 'pending_budget_certification') {
            throw new \InvalidArgumentException('PR is not awaiting budget certification.');
        }

        $updateData = [
            'status' => 'pending_secretariat_review',
            'budget_certified_by' => $userId,
            'budget_certified_at' => now(),
        ];
        if ($fundSource) $updateData['fund_source'] = $fundSource;
        if ($accountCode) $updateData['account_code'] = $accountCode;

        $pr->update($updateData);

        BlockchainEvent::recordEvent(
            'PR_BUDGET_CERTIFIED', $userId,
            'App\Models\PurchaseRequisition', $pr->id,
            null,
            ['pr_ref' => $pr->pr_reference, 'total' => $pr->total_value]
        );

        return $pr->fresh();
    }

    /**
     * BAC Secretariat accepts the PR and recommends a procurement mode.
     * Mode now requires BAC Chairperson confirmation (Fix 6 compliance).
     */
    public function acceptBySecretariat(PurchaseRequisition $pr, int $userId, ?string $procurementMode = null, ?string $modeJustification = null): PurchaseRequisition
    {
        if ($pr->status !== 'pending_secretariat_review') {
            throw new \InvalidArgumentException('PR is not awaiting Secretariat review.');
        }

        if (!$procurementMode) {
            throw new \InvalidArgumentException('Procurement mode recommendation is required for acceptance.');
        }

        // RA 12009 ABC Threshold Enforcement (P2,000,000)
        if ($pr->total_value > 2000000 && $procurementMode !== 'competitive_bidding') {
            $appEntry = $pr->appEntry;
            $hasValidJustification = $appEntry && !empty($appEntry->justification) && $appEntry->status === 'approved';
            
            if (!$hasValidJustification) {
                throw new \InvalidArgumentException(
                    "This PR exceeds ₱2,000,000. Competitive Bidding is required unless an approved APP justification exists for alternative modes."
                );
            }
        }

        $updateData = [
            'status' => 'pending_mode_confirmation',
            'accepted_by' => $userId,
            'accepted_at' => now(),
            'recommended_mode' => $procurementMode,
            'recommended_mode_justification' => $modeJustification,
        ];

        $pr->update($updateData);

        BlockchainEvent::recordEvent(
            'PR_ACCEPTED', $userId,
            'App\Models\PurchaseRequisition', $pr->id,
            null,
            ['pr_ref' => $pr->pr_reference, 'recommended_mode' => $procurementMode, 'abc' => $pr->total_value]
        );

        return $pr->fresh();
    }

    /**
     * BAC Chairperson confirms or overrides the recommended procurement mode.
     */
    public function confirmMode(PurchaseRequisition $pr, int $userId, string $confirmedMode): PurchaseRequisition
    {
        if ($pr->status !== 'pending_mode_confirmation') {
            throw new \InvalidArgumentException('PR is not awaiting mode confirmation.');
        }

        $pr->update([
            'status' => 'mode_confirmed',
            'procurement_mode' => $confirmedMode,
            'mode_confirmed_by' => $userId,
            'mode_confirmed_at' => now(),
        ]);

        BlockchainEvent::recordEvent(
            'PR_MODE_CONFIRMED', $userId,
            'App\Models\PurchaseRequisition', $pr->id,
            null,
            [
                'pr_ref' => $pr->pr_reference,
                'recommended_mode' => $pr->recommended_mode,
                'confirmed_mode' => $confirmedMode,
                'abc' => $pr->total_value,
            ]
        );

        return $pr->fresh();
    }

    /**
     * Return PR for revision at any stage.
     */
    public function returnForRevision(PurchaseRequisition $pr, int $userId, string $remarks): PurchaseRequisition
    {
        if (in_array($pr->status, ['draft', 'accepted', 'cancelled'])) {
            throw new \InvalidArgumentException('PR cannot be returned in its current status via standard return.');
        }

        $pr->update([
            'status' => 'returned',
            'return_remarks' => $remarks,
        ]);

        AuditLog::log('PR_RETURNED', $userId, 'App\Models\PurchaseRequisition', $pr->id,
            null, ['remarks' => $remarks], false);

        return $pr->fresh();
    }

    /**
     * Specialized return for mode reassignment after a PR has been accepted.
     * Records a specific blockchain event for audit transparency.
     */
    public function returnForModeReassignment(PurchaseRequisition $pr, int $userId, string $remarks): PurchaseRequisition
    {
        if ($pr->status !== 'accepted') {
            throw new \InvalidArgumentException('Only accepted PRs can be returned for mode reassignment.');
        }

        $originalMode = $pr->procurement_mode;

        $pr->update([
            'status' => 'pending_secretariat_review', // Return to Secretariat bowl
            'return_remarks' => "MODE REASSIGNMENT REQ: " . $remarks,
            'procurement_mode' => null, // Clear to force re-selection
        ]);

        BlockchainEvent::recordEvent(
            'PR_RETURNED_FOR_MODE_REASSIGNMENT', $userId,
            'App\Models\PurchaseRequisition', $pr->id,
            null,
            [
                'original_mode' => $originalMode,
                'remarks' => $remarks,
                'actor_id' => $userId
            ]
        );

        AuditLog::log('PR_RETURNED_FOR_MODE_REASSIGNMENT', $userId, 'App\Models\PurchaseRequisition', $pr->id,
            ['mode' => $originalMode], ['remarks' => $remarks], true);

        return $pr->fresh();
    }

    /**
     * Cancel a PR.
     */
    public function cancel(PurchaseRequisition $pr, int $userId, string $reason): PurchaseRequisition
    {
        if ($pr->status === 'cancelled') {
            throw new \InvalidArgumentException('PR is already cancelled.');
        }

        $pr->update([
            'status' => 'cancelled',
            'return_remarks' => $reason,
        ]);

        AuditLog::log('PR_CANCELLED', $userId, 'App\Models\PurchaseRequisition', $pr->id,
            null, ['reason' => $reason], false);

        return $pr->fresh();
    }
}

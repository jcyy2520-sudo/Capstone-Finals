<?php

namespace App\Http\Controllers\BAC;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Contract;
use App\Models\InspectionAcceptanceReport;
use App\Models\BlockchainEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InspectionAcceptanceReportController extends Controller
{
    /**
     * List IARs for a contract.
     */
    public function index(Request $request, Contract $contract)
    {
        $iars = InspectionAcceptanceReport::with(['inspector', 'acceptor'])
            ->where('contract_id', $contract->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($iars);
    }

    /**
     * List all IARs visible to the current role.
     */
    public function all(Request $request)
    {
        $query = InspectionAcceptanceReport::with(['contract.award.invitation', 'inspector', 'acceptor'])
            ->orderBy('created_at', 'desc');

        $user = $request->user();
        if ($user->role?->name === Role::DEPARTMENT_REQUESTER) {
            $query->whereHas('contract.purchaseRequisition', function ($purchaseRequisitionQuery) use ($user) {
                $purchaseRequisitionQuery->where('requester_id', $user->id);
            });
        }

        if ($user->role?->name === Role::INSPECTION_ACCEPTANCE_COMMITTEE) {
            $query->where(function ($inspectionQuery) use ($user) {
                $inspectionQuery
                    ->where('inspected_by', $user->id)
                    ->orWhere('accepted_by', $user->id);
            });
        }

        return response()->json($query->get());
    }

    /**
        * Create a new IAR (inspection report by the Inspection and Acceptance Committee).
     */
    public function store(Request $request, Contract $contract)
    {
        if (!in_array($contract->status, ['active'])) {
            return response()->json(['message' => 'IAR can only be created for active contracts.'], 400);
        }

        $validated = $request->validate([
            'inspection_items' => 'required|array|min:1',
            'inspection_items.*.description' => 'required|string',
            'inspection_items.*.quantity' => 'required|numeric|min:0',
            'inspection_items.*.unit' => 'required|string',
            'inspection_items.*.status' => 'required|in:passed,failed,partial',
            'inspection_remarks' => 'nullable|string|max:2000',
        ]);

        $iar = InspectionAcceptanceReport::create([
            'contract_id' => $contract->id,
            'inspection_items' => $validated['inspection_items'],
            'inspected_by' => $request->user()->id,
            'inspection_remarks' => $validated['inspection_remarks'] ?? null,
            'inspected_at' => now(),
            'status' => 'inspected',
        ]);

        BlockchainEvent::recordEvent(
            'IAR_CREATED',
            $request->user()->id,
            InspectionAcceptanceReport::class,
            $iar->id,
            null,
            ['contract_id' => $contract->id, 'items_count' => count($validated['inspection_items'])]
        );

        return response()->json(['message' => 'Inspection report created.', 'iar' => $iar], 201);
    }

    /**
        * Accept an IAR (by the Inspection and Acceptance Committee).
     */
    public function accept(Request $request, InspectionAcceptanceReport $iar)
    {
        if ($iar->status !== 'inspected') {
            return response()->json(['message' => 'IAR is not in inspected status.'], 400);
        }

        DB::beginTransaction();
        try {
            $iar->update([
                'status' => 'accepted',
                'accepted_by' => $request->user()->id,
                'accepted_at' => now(),
            ]);

            BlockchainEvent::recordEvent(
                'IAR_ACCEPTED',
                $request->user()->id,
                InspectionAcceptanceReport::class,
                $iar->id,
                null,
                ['contract_id' => $iar->contract_id]
            );

            DB::commit();
            return response()->json(['message' => 'IAR accepted.', 'iar' => $iar->fresh()]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to accept IAR.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Reject an IAR.
     */
    public function reject(Request $request, InspectionAcceptanceReport $iar)
    {
        if ($iar->status !== 'inspected') {
            return response()->json(['message' => 'IAR is not in inspected status.'], 400);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|min:10',
        ]);

        $iar->update([
            'status' => 'rejected',
            'inspection_remarks' => ($iar->inspection_remarks ? $iar->inspection_remarks . "\n\n" : '') . "REJECTED: " . $validated['rejection_reason'],
        ]);

        return response()->json(['message' => 'IAR rejected.', 'iar' => $iar->fresh()]);
    }
}

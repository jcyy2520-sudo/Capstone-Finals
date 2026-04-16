<?php

namespace App\Http\Controllers\Department;

use App\Http\Controllers\Controller;
use App\Http\Requests\Department\StorePurchaseRequisitionRequest;
use App\Models\PurchaseRequisition;
use App\Services\PurchaseRequisitionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PurchaseRequisitionController extends Controller
{
    public function __construct(
        protected PurchaseRequisitionService $service
    ) {}

    /**
     * GET /api/purchase-requisitions
     */
    public function index(Request $request): JsonResponse
    {
        $query = PurchaseRequisition::with(['department', 'requester', 'appEntry', 'latestBlockchainEvent']);
        $user = $request->user();

        // Role-based filtering
        if ($user->hasRole('department_requester')) {
            $query->where('department_id', $user->department_id);
        } elseif ($user->hasRole('budget_officer')) {
            $query->whereIn('status', ['pending_budget_certification', 'pending_secretariat_review', 'accepted']);
        } elseif ($user->hasRole('bac_secretariat')) {
            // Secretariat sees everything from budget review onwards or according to filters
            $query->whereIn('status', [
                'pending_budget_certification', 'pending_secretariat_review', 
                'pending_mode_confirmation', 'mode_confirmed', 'accepted',
                'returned', 'cancelled'
            ]);
        } elseif ($user->hasRole('bac_chairperson')) {
            // Chairperson sees PRs pending mode confirmation
            $query->whereIn('status', [
                'pending_mode_confirmation', 'mode_confirmed', 'accepted'
            ]);
        }

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('pr_reference', 'like', '%' . $request->search . '%')
                  ->orWhereHas('appEntry', fn ($q2) => $q2->where('project_title', 'like', '%' . $request->search . '%'));
            });
        }

        $prs = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($prs);
    }

    /**
     * POST /api/purchase-requisitions
     */
    public function store(StorePurchaseRequisitionRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $lineItems = $validated['line_items'];
        unset($validated['line_items']);

        $pr = $this->service->create($validated, $lineItems, $request->user()->id);

        // Auto-submit if requested
        if (($request->status ?? 'draft') === 'pending_dh_endorsement') {
            $pr = $this->service->submitForEndorsement($pr, $request->user()->id);
        }

        return response()->json([
            'message' => 'Purchase Requisition created.',
            'data' => $pr,
        ], 201);
    }

    /**
     * GET /api/purchase-requisitions/{id}
     */
    public function show(PurchaseRequisition $purchaseRequisition): JsonResponse
    {
        return response()->json([
            'data' => $purchaseRequisition->load(['lineItems', 'department', 'requester', 'appEntry']),
        ]);
    }

    /**
     * PUT /api/purchase-requisitions/{id}
     */
    public function update(Request $request, PurchaseRequisition $purchaseRequisition): JsonResponse
    {
        if (!in_array($purchaseRequisition->status, ['draft', 'returned'])) {
            return response()->json(['message' => 'Only draft or returned PRs can be edited.'], 422);
        }

        $validated = $request->validate([
            'purpose' => 'sometimes|string',
            'date_required' => 'sometimes|date|after:today',
            'urgency_level' => 'nullable|in:routine,urgent,emergency',
            'line_items' => 'sometimes|array|min:1',
            'line_items.*.id' => 'nullable|integer',
            'line_items.*.item_description' => 'required|string',
            'line_items.*.unit_of_measure' => 'required|string|max:50',
            'line_items.*.quantity' => 'required|integer|min:1',
            'line_items.*.unit_cost' => 'required|numeric|min:0.01',
        ]);

        // Update line items if provided
        if (isset($validated['line_items'])) {
            // Delete existing and recreate
            $purchaseRequisition->lineItems()->delete();
            foreach ($validated['line_items'] as $item) {
                $item['purchase_requisition_id'] = $purchaseRequisition->id;
                $item['estimated_unit_cost'] = $item['unit_cost'] ?? 0;
                $item['estimated_total_cost'] = ($item['quantity'] ?? 0) * ($item['estimated_unit_cost']);
                unset($item['id'], $item['unit_cost'], $item['total_cost']);
                \App\Models\PrLineItem::create($item);
            }
            $purchaseRequisition->recomputeTotal();
            unset($validated['line_items']);
        }

        $purchaseRequisition->update($validated);

        return response()->json([
            'message' => 'PR updated.',
            'data' => $purchaseRequisition->fresh()->load(['lineItems', 'department', 'requester', 'appEntry']),
        ]);
    }

    /**
     * DELETE /api/purchase-requisitions/{id}
     */
    public function destroy(PurchaseRequisition $purchaseRequisition): JsonResponse
    {
        if ($purchaseRequisition->status !== 'draft') {
            return response()->json(['message' => 'Only draft PRs can be deleted.'], 422);
        }

        $purchaseRequisition->lineItems()->delete();
        $purchaseRequisition->delete();

        return response()->json(['message' => 'PR deleted.']);
    }

    // ── Status Transition Actions ────────────────────────

    /**
     * POST /api/purchase-requisitions/{id}/submit
     */
    public function submit(Request $request, PurchaseRequisition $purchaseRequisition): JsonResponse
    {
        try {
            $pr = $this->service->submitForEndorsement($purchaseRequisition, $request->user()->id);
            return response()->json(['message' => 'PR submitted for endorsement.', 'data' => $pr]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/purchase-requisitions/{id}/endorse
     */
    public function endorse(Request $request, PurchaseRequisition $purchaseRequisition): JsonResponse
    {
        try {
            $pr = $this->service->endorse($purchaseRequisition, $request->user()->id);
            return response()->json(['message' => 'PR endorsed.', 'data' => $pr]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/purchase-requisitions/{id}/certify-budget
     */
    public function certifyBudget(Request $request, PurchaseRequisition $purchaseRequisition): JsonResponse
    {
        $validated = $request->validate([
            'fund_source' => 'required|string|max:255',
            'account_code' => 'required|string|max:100',
        ]);

        try {
            $pr = $this->service->certifyBudget(
                $purchaseRequisition,
                $request->user()->id,
                $validated['fund_source'],
                $validated['account_code']
            );
            return response()->json(['message' => 'Budget certified.', 'data' => $pr]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/purchase-requisitions/{id}/accept
     */
    public function accept(Request $request, PurchaseRequisition $purchaseRequisition): JsonResponse
    {
        $validated = $request->validate([
            'procurement_mode' => 'required|string|max:100',
            'mode_justification' => 'nullable|string|max:2000',
        ]);

        try {
            $pr = $this->service->acceptBySecretariat(
                $purchaseRequisition,
                $request->user()->id,
                $validated['procurement_mode'],
                $validated['mode_justification'] ?? null
            );
            return response()->json(['message' => 'PR accepted. Procurement mode pending BAC Chairperson confirmation.', 'data' => $pr]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/purchase-requisitions/{id}/confirm-mode
     */
    public function confirmMode(Request $request, PurchaseRequisition $purchaseRequisition): JsonResponse
    {
        $validated = $request->validate([
            'confirmed_mode' => 'required|string|max:100',
        ]);

        try {
            $pr = $this->service->confirmMode(
                $purchaseRequisition,
                $request->user()->id,
                $validated['confirmed_mode']
            );
            return response()->json(['message' => 'Procurement mode confirmed.', 'data' => $pr]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/purchase-requisitions/{id}/return
     */
    public function returnPr(Request $request, PurchaseRequisition $purchaseRequisition): JsonResponse
    {
        $request->validate(['remarks' => 'required|string|min:10']);

        try {
            $pr = $this->service->returnForRevision($purchaseRequisition, $request->user()->id, $request->remarks);
            return response()->json(['message' => 'PR returned for revision.', 'data' => $pr]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/purchase-requisitions/{id}/return-for-mode-reassignment
     */
    public function returnForModeReassignment(Request $request, PurchaseRequisition $purchaseRequisition): JsonResponse
    {
        $request->validate(['remarks' => 'required|string|min:5']);

        try {
            $pr = $this->service->returnForModeReassignment($purchaseRequisition, $request->user()->id, $request->remarks);
            return response()->json(['message' => 'PR returned for mode reassignment.', 'data' => $pr]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}

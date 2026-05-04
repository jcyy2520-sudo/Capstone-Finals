<?php

namespace App\Http\Controllers\BAC;

use App\Http\Controllers\Controller;
use App\Http\Requests\BAC\StoreAppEntryRequest;
use App\Models\AppEntry;
use App\Models\Role;
use App\Services\AppEntryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class AppEntryController extends Controller
{
    public function __construct(
        protected AppEntryService $service
    ) {}

    /**
     * GET /api/app-entries
     * List APP entries with filtering by status, department, fiscal year.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AppEntry::with(['department', 'creator']);
        $user = $request->user();

        // Role-based filtering
        if ($user->hasRole(Role::DEPARTMENT_REQUESTER)) {
            // Department requesters see only their department's entries
            $query->where('department_id', $user->department_id);
        } elseif ($user->hasRole(Role::DEPARTMENT_HEAD)) {
            $query->where('department_id', $user->department_id)
                ->whereIn('status', ['submitted', 'returned', 'pending_budget_certification', 'approved']);
        } elseif ($user->hasRole(Role::BUDGET_OFFICER)) {
            // Budget officers see entries awaiting their certification
            $query->whereIn('status', ['pending_budget_certification', 'pending_secretariat_consolidation', 'pending_hope_approval', 'approved']);
        } elseif ($user->hasAnyRole([Role::BAC_SECRETARIAT, Role::PROCUREMENT_OFFICER])) {
            $query->whereIn('status', ['pending_secretariat_consolidation', 'pending_hope_approval', 'approved', 'returned']);
        }
        // BAC Secretariat, HOPE, Admin, Auditor see all

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        if ($request->filled('fiscal_year')) {
            $query->where('fiscal_year', $request->fiscal_year);
        }
        if ($request->filled('search')) {
            $query->where('project_title', 'like', '%' . $request->search . '%');
        }

        $entries = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($entries);
    }

    /**
     * POST /api/app-entries
     * Create new APP entry.
     */
    public function store(StoreAppEntryRequest $request): JsonResponse
    {
        $mfoOptions = collect(config('procureseal.mfo_options', []));
        $validated = $request->validated();

        // Default fiscal year to current
        $validated['fiscal_year'] = $validated['fiscal_year'] ?? now()->year;
        $validated['mfo_name_snapshot'] = optional($mfoOptions->firstWhere('code', $validated['mfo_code']))['name'] ?? null;
        $validated['coa_trace_tag'] = $this->buildCoaTraceTag(
            $validated['fiscal_year'],
            $validated['department_id'],
            $validated['pap_code'],
            $validated['uacs_object_code']
        );

        $entry = $this->service->create($validated, $request->user()->id);

        // If status is 'submitted', auto-submit
        if (($request->status ?? 'draft') === 'submitted') {
            $entry = $this->service->submit($entry, $request->user()->id);
        }

        return response()->json([
            'message' => $entry->status === 'submitted'
                ? 'APP entry submitted for department head endorsement.'
                : 'APP entry saved as draft.',
            'data' => $entry,
        ], 201);
    }

    /**
     * GET /api/app-entries/{id}
     */
    public function show(AppEntry $appEntry): JsonResponse
    {
        return response()->json([
            'data' => $appEntry->load(['department', 'creator', 'purchaseRequisitions']),
        ]);
    }

    /**
     * PUT /api/app-entries/{id}
     * Update a draft or returned entry.
     */
    public function update(Request $request, AppEntry $appEntry): JsonResponse
    {
        if (!in_array($appEntry->status, ['draft', 'returned'])) {
            return response()->json([
                'message' => 'Only draft or returned entries can be edited.',
            ], 422);
        }

        $mfoOptions = collect(config('procureseal.mfo_options', []));
        $mfoCodes = $mfoOptions->pluck('code')->all();
        $papCodes = config('procureseal.pap_codes', []);
        $uacsCodes = config('procureseal.uacs_object_codes', []);
        $budgetRefs = config('procureseal.budget_references', []);

        $validated = $request->validate([
            'project_title' => 'sometimes|string|max:300',
            'description' => 'sometimes|string',
            'mfo_code' => ['sometimes', Rule::in($mfoCodes)],
            'pap_code' => ['sometimes', 'string', 'max:80', 'regex:/^[A-Za-z0-9][A-Za-z0-9\-.\/]{2,79}$/', Rule::in($papCodes)],
            'uacs_object_code' => ['sometimes', Rule::in($uacsCodes)],
            'approved_budget_reference' => ['sometimes', Rule::in($budgetRefs)],
            'category' => 'sometimes|in:goods,services,infrastructure_works,consulting_services',
            'mode' => 'sometimes|string',
            'abc' => 'sometimes|numeric|min:1',
            'unit_of_measurement' => 'nullable|string|max:50',
            'quantity' => 'nullable|integer|min:1',
            'fund_source' => 'sometimes|string',
            'account_code' => 'sometimes|string',
            'implementing_unit' => 'sometimes|string',
            'target_start_quarter' => 'sometimes|in:Q1,Q2,Q3,Q4',
            'target_completion_quarter' => 'sometimes|in:Q1,Q2,Q3,Q4',
            'justification' => 'sometimes|string',
            'fiscal_year' => 'sometimes|integer',
        ]);

        $nextFiscalYear = $validated['fiscal_year'] ?? $appEntry->fiscal_year;
        $nextDepartmentId = $validated['department_id'] ?? $appEntry->department_id;
        $nextPap = $validated['pap_code'] ?? $appEntry->pap_code;
        $nextUacs = $validated['uacs_object_code'] ?? $appEntry->uacs_object_code;

        if (isset($validated['mfo_code'])) {
            $validated['mfo_name_snapshot'] = optional($mfoOptions->firstWhere('code', $validated['mfo_code']))['name'] ?? null;
        }

        if ($nextPap && $nextUacs && $nextDepartmentId && $nextFiscalYear) {
            $validated['coa_trace_tag'] = $this->buildCoaTraceTag(
                (int) $nextFiscalYear,
                (int) $nextDepartmentId,
                (string) $nextPap,
                (string) $nextUacs
            );
        }

        $appEntry->update($validated);

        return response()->json([
            'message' => 'APP entry updated.',
            'data' => $appEntry->fresh()->load('department', 'creator'),
        ]);
    }

    /**
     * DELETE /api/app-entries/{id}
     * Delete a draft entry.
     */
    public function destroy(AppEntry $appEntry): JsonResponse
    {
        return response()->json([
            'message' => 'Draft APP entries are immutable. Keep the draft or route it through the formal return workflow.',
        ], 422);
    }

    // ── Status Transition Actions ────────────────────────

    /**
     * POST /api/app-entries/{id}/submit
     */
    public function submit(Request $request, AppEntry $appEntry): JsonResponse
    {
        try {
            $entry = $this->service->submit($appEntry, $request->user()->id);
            return response()->json(['message' => 'APP entry submitted.', 'data' => $entry]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/app-entries/{id}/endorse
     * Department Head endorses the APP entry.
     */
    public function endorse(Request $request, AppEntry $appEntry): JsonResponse
    {
        try {
            $entry = $this->service->endorse($appEntry, $request->user()->id);
            return response()->json(['message' => 'APP entry endorsed for budget certification.', 'data' => $entry]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/app-entries/{id}/accept
     * BAC Secretariat or Procurement Officer consolidates the APP entry.
     */
    public function accept(Request $request, AppEntry $appEntry): JsonResponse
    {
        try {
            $entry = $this->service->acceptForConsolidation($appEntry, $request->user()->id);
            return response()->json(['message' => 'Entry consolidated and routed for HOPE approval.', 'data' => $entry]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/app-entries/{id}/certify-budget
     * Budget Officer certifies fund availability.
     */
    public function certifyBudget(Request $request, AppEntry $appEntry): JsonResponse
    {
        $validated = $request->validate([
            'remarks' => 'nullable|string|max:2000',
        ]);

        try {
            $entry = $this->service->certifyBudget($appEntry, $request->user()->id, $validated['remarks'] ?? null);
            return response()->json(['message' => 'Budget certified.', 'data' => $entry]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/app-entries/{id}/approve
     * HOPE approves the entry.
     */
    public function approve(Request $request, AppEntry $appEntry): JsonResponse
    {
        $validated = $request->validate([
            'remarks' => 'nullable|string|max:2000',
        ]);

        try {
            $entry = $this->service->approveByHOPE($appEntry, $request->user()->id, $validated['remarks'] ?? null);
            return response()->json(['message' => 'APP entry approved by HOPE.', 'data' => $entry]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/app-entries/{id}/return
     * HOPE or Secretariat returns for revision.
     */
    public function returnEntry(Request $request, AppEntry $appEntry): JsonResponse
    {
        $request->validate(['remarks' => 'required|string|min:10']);

        try {
            $entry = $this->service->returnForRevision($appEntry, $request->user()->id, $request->remarks);
            return response()->json(['message' => 'Entry returned for revision.', 'data' => $entry]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * GET /api/app-entries/mode-recommendation
     * Returns procurement mode recommendation based on ABC.
     */
    public function modeRecommendation(Request $request): JsonResponse
    {
        $request->validate(['abc' => 'required|numeric|min:0']);
        return response()->json(AppEntryService::recommendMode($request->abc));
    }

    /**
     * GET /api/app-entries/reference-data
     * Return APP planning reference lists for MFO/PAP/UACS/Budget link fields.
     */
    public function referenceData(): JsonResponse
    {
        return response()->json([
            'mfo_options' => config('procureseal.mfo_options', []),
            'pap_codes' => config('procureseal.pap_codes', []),
            'uacs_object_codes' => config('procureseal.uacs_object_codes', []),
            'budget_references' => config('procureseal.budget_references', []),
        ]);
    }

    private function buildCoaTraceTag(int $fiscalYear, int $departmentId, string $papCode, string $uacsCode): string
    {
        $normalize = static fn (string $value) => strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $value));

        return sprintf(
            'COA-%d-D%s-P%s-U%s',
            $fiscalYear,
            $departmentId,
            $normalize($papCode),
            $normalize($uacsCode)
        );
    }
}

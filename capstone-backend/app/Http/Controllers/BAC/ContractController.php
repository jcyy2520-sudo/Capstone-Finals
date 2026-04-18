<?php

namespace App\Http\Controllers\BAC;

use App\Http\Controllers\Controller;
use App\Http\Requests\BAC\StoreContractRequest;
use App\Models\Award;
use App\Models\Contract;
use App\Models\ContractAmendment;
use App\Models\ContractExtension;
use App\Models\ContractSuspension;
use App\Models\BlockchainEvent;
use App\Services\EthereumBridgeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContractController extends Controller
{
    /**
     * HOPE auto-generates the formal Contract and issues the Notice to Proceed (NTP).
     */
    public function generateContract(StoreContractRequest $request, Award $award)
    {
        if ($award->status !== 'ACKNOWLEDGED') {
            return response()->json(['message' => 'Notice of Award must be ACKNOWLEDGED by the vendor before Contract generation.'], 400);
        }

        $validated = $request->validated();

        DB::beginTransaction();
        try {
            $durationDays = $validated['duration_days'];
            $ntpDate = now();
            $endDate = now()->addDays($durationDays);
            
            $contractReference = Contract::generateReference();
            $contractHash = hash('sha256', "CONTRACT_{$contractReference}_{$award->id}");
            $ntpHash = hash('sha256', "NTP_{$contractReference}_{$award->id}");

            // Create Contract
            $contract = Contract::create([
                'contract_reference' => $contractReference,
                'award_id' => $award->id,
                'vendor_id' => $award->vendor_id,
                'purchase_requisition_id' => $award->invitation->purchase_requisition_id ?? null,
                'ntp_date' => $ntpDate->toDateString(),
                'duration_days' => $durationDays,
                'end_date' => $endDate->toDateString(),
                'contract_amount' => $award->contract_amount,
                'contract_document_path' => "simulated/contracts/{$contractReference}.pdf",
                'contract_document_hash' => $contractHash,
                'progress_percentage' => 0.00,
                'status' => 'active',
            ]);

            // Mutate Award payload mapping
            $award->update([
                'status' => 'NTP_ISSUED',
                'ntp_reference' => "NTP-" . $contractReference,
                'ntp_document_path' => "simulated/ntp/NTP_{$contractReference}.pdf",
                'ntp_document_hash' => $ntpHash,
                'ntp_date' => $ntpDate->toDateString(),
                'ntp_issued_at' => now(),
            ]);

            // Blockchain Integration
            BlockchainEvent::recordEvent(
                'CONTRACT_SIGNED',
                $request->user()->id,
                Contract::class,
                $contract->id,
                $contractHash,
                ['contract_id' => $contract->id, 'duration_days' => $durationDays]
            );

            BlockchainEvent::recordEvent(
                'NTP_ISSUED',
                $request->user()->id,
                Contract::class,
                $contract->id,
                $ntpHash,
                ['contract_id' => $contract->id]
            );

            // Anchor CONTRACT_SIGNED on Ethereum
            try {
                $bridge = app(EthereumBridgeService::class);
                $procurementId = (string) ($award->invitation->purchase_requisition_id ?? $award->id);
                $bridge->anchorEvent($procurementId, $contractHash, 4); // 4 = CONTRACT_SIGNED
            } catch (\Throwable $e) {
                \Log::warning("[Contract] Ethereum anchoring skipped: {$e->getMessage()}");
            }

            DB::commit();

            return response()->json([
                'message' => 'Contract securely mapped and Notice to Proceed dynamically issued.',
                'contract' => $contract
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to generate contract.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * HOPE Suspends Contract
     */
    public function suspendContract(Request $request, Contract $contract)
    {
        if ($contract->status !== 'active') {
             return response()->json(['message' => 'Only active contracts can be suspended.'], 400);
        }

        $validated = $request->validate([
             'reason' => 'required|string|min:15',
        ]);

        DB::beginTransaction();
        try {
            $contract->update(['status' => 'suspended']);

            ContractSuspension::create([
                'contract_id' => $contract->id,
                'reason' => $validated['reason'],
                'suspension_date' => now()->toDateString(),
                'issued_by' => $request->user()->id,
            ]);

            BlockchainEvent::recordEvent(
                'CONTRACT_SUSPENDED',
                $request->user()->id,
                Contract::class,
                $contract->id,
                null,
                ['contract_id' => $contract->id, 'reason' => $validated['reason']]
            );

            DB::commit();
            return response()->json(['message' => 'Contract formally suspended.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to suspend contract.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Resume a suspended contract.
     */
    public function resumeContract(Request $request, Contract $contract)
    {
        if ($contract->status !== 'suspended') {
            return response()->json(['message' => 'Only suspended contracts can be resumed.'], 400);
        }

        DB::beginTransaction();
        try {
            $contract->update(['status' => 'active']);

            $suspension = ContractSuspension::where('contract_id', $contract->id)
                ->whereNull('resumption_date')
                ->latest()
                ->first();

            if ($suspension) {
                $suspensionDays = now()->diffInDays($suspension->suspension_date);
                $suspension->update([
                    'resumption_date' => now()->toDateString(),
                    'suspension_days' => $suspensionDays,
                ]);

                // Extend contract end date by suspension days
                $contract->update([
                    'end_date' => $contract->end_date->addDays($suspensionDays)->toDateString(),
                ]);
            }

            BlockchainEvent::recordEvent(
                'CONTRACT_RESUMED',
                $request->user()->id,
                Contract::class,
                $contract->id,
                null,
                ['contract_id' => $contract->id, 'suspension_days' => $suspensionDays ?? 0]
            );

            DB::commit();
            return response()->json(['message' => 'Contract resumed. End date extended by suspension days.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to resume contract.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * HOPE Terminates Contract
     */
    public function terminateContract(Request $request, Contract $contract)
    {
        if ($contract->status === 'completed' || $contract->status === 'terminated') {
             return response()->json(['message' => 'Contract is already closed or terminated.'], 400);
        }

        $validated = $request->validate([
             'reason' => 'required|string|min:20',
        ]);

        DB::beginTransaction();
        try {
            $contract->update(['status' => 'terminated']);

            if (method_exists(BlockchainEvent::class, 'recordEvent')) {
                 BlockchainEvent::recordEvent(
                     'CONTRACT_TERMINATED',
                     $request->user()->id,
                     Contract::class,
                     $contract->id,
                     null,
                     ['contract_id' => $contract->id, 'reason' => $validated['reason']]
                 );
            }
            DB::commit();

            return response()->json(['message' => 'Contract legally terminated. Record anchored to blockchain.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to terminate contract.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Request a contract amendment.
     */
    public function requestAmendment(Request $request, Contract $contract)
    {
        if (!in_array($contract->status, ['active', 'suspended'])) {
            return response()->json(['message' => 'Amendments only allowed on active or suspended contracts.'], 400);
        }

        $validated = $request->validate([
            'type' => 'required|in:scope_change,cost_change,duration_change,other',
            'description' => 'required|string|min:10',
            'justification' => 'required|string|min:10',
            'original_value' => 'nullable|numeric|min:0',
            'amended_value' => 'nullable|numeric|min:0',
        ]);

        $amendment = ContractAmendment::create([
            'contract_id' => $contract->id,
            'type' => $validated['type'],
            'description' => $validated['description'],
            'justification' => $validated['justification'],
            'original_value' => $validated['original_value'] ?? null,
            'amended_value' => $validated['amended_value'] ?? null,
            'status' => 'pending',
            'requested_by' => $request->user()->id,
        ]);

        return response()->json(['message' => 'Amendment request submitted.', 'amendment' => $amendment], 201);
    }

    /**
     * Approve or reject a contract amendment.
     */
    public function approveAmendment(Request $request, ContractAmendment $amendment)
    {
        if ($amendment->status !== 'pending') {
            return response()->json(['message' => 'Amendment is not pending.'], 400);
        }

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
        ]);

        DB::beginTransaction();
        try {
            $amendment->update([
                'status' => $validated['action'] === 'approve' ? 'approved' : 'rejected',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            if ($validated['action'] === 'approve') {
                $contract = $amendment->contract;
                if ($amendment->type === 'cost_change' && $amendment->amended_value) {
                    $contract->update(['contract_amount' => $amendment->amended_value]);
                }

                BlockchainEvent::recordEvent(
                    'AMENDMENT_APPROVED',
                    $request->user()->id,
                    ContractAmendment::class,
                    $amendment->id,
                    null,
                    ['contract_id' => $contract->id, 'type' => $amendment->type]
                );
            }

            DB::commit();
            return response()->json(['message' => "Amendment {$validated['action']}d."]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to process amendment.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Request a contract extension.
     */
    public function requestExtension(Request $request, Contract $contract)
    {
        if (!in_array($contract->status, ['active'])) {
            return response()->json(['message' => 'Extensions only allowed on active contracts.'], 400);
        }

        $validated = $request->validate([
            'additional_days' => 'required|integer|min:1|max:365',
            'justification' => 'required|string|min:10',
            'grounds' => 'required|in:force_majeure,govt_delay,scope_change,other',
        ]);

        $extension = ContractExtension::create([
            'contract_id' => $contract->id,
            'additional_days' => $validated['additional_days'],
            'new_end_date' => $contract->end_date->addDays($validated['additional_days'])->toDateString(),
            'justification' => $validated['justification'],
            'grounds' => $validated['grounds'],
            'status' => 'pending',
            'requested_by' => $request->user()->id,
        ]);

        return response()->json(['message' => 'Extension request submitted.', 'extension' => $extension], 201);
    }

    /**
     * Approve or reject a contract extension.
     */
    public function approveExtension(Request $request, ContractExtension $extension)
    {
        if ($extension->status !== 'pending') {
            return response()->json(['message' => 'Extension is not pending.'], 400);
        }

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
        ]);

        DB::beginTransaction();
        try {
            $extension->update([
                'status' => $validated['action'] === 'approve' ? 'approved' : 'rejected',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            if ($validated['action'] === 'approve') {
                $contract = $extension->contract;
                $contract->update([
                    'end_date' => $extension->new_end_date,
                    'duration_days' => $contract->duration_days + $extension->additional_days,
                ]);

                BlockchainEvent::recordEvent(
                    'EXTENSION_APPROVED',
                    $request->user()->id,
                    ContractExtension::class,
                    $extension->id,
                    null,
                    ['contract_id' => $contract->id, 'additional_days' => $extension->additional_days]
                );
            }

            DB::commit();
            return response()->json(['message' => "Extension {$validated['action']}d."]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to process extension.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Data Retrieval for Dashboard
     */
    public function index(Request $request)
    {
        // 1. Fetch ACKNOWLEDGED awards so they can be converted to Contracts
        $pendingAwards = Award::with('vendor')
                ->where('status', 'ACKNOWLEDGED')
                ->get();

        // 2. Fetch tracking Contracts
        $contracts = Contract::with('vendor')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($contract) {
                     // Dynamically map days_remaining via Eloquent attribute internally, but we can compute progress safely
                     $start = \Carbon\Carbon::parse($contract->ntp_date);
                     $end = \Carbon\Carbon::parse($contract->end_date);
                     $now = now();
                     
                     if ($now->greaterThanOrEqualTo($end)) {
                         $pct = 100;
                     } elseif ($now->lessThanOrEqualTo($start)) {
                         $pct = 0;
                     } else {
                         $total = $start->diffInDays($end);
                         $elapsed = $start->diffInDays($now);
                         $pct = $total > 0 ? ($elapsed / $total) * 100 : 100;
                     }
                     
                     $contract->computed_progress = min(100, max(0, $pct));
                     $contract->days_remaining = $contract->days_remaining; // Invoke Eloquent accessor
                     return $contract;
                });

        return response()->json([
             'pending_awards' => $pendingAwards,
             'contracts' => $contracts
        ]);
    }
}

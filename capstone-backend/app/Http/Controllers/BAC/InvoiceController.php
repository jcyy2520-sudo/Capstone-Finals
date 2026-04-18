<?php

namespace App\Http\Controllers\BAC;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\InspectionAcceptanceReport;
use App\Models\Invoice;
use App\Models\Vendor;
use App\Models\BlockchainEvent;
use App\Services\EthereumBridgeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    /**
     * List all invoices (filterable by role).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Invoice::with(['contract', 'inspectionReport', 'vendor', 'validator'])
            ->orderBy('created_at', 'desc');

        // Vendors see only their own invoices
        if ($user->role?->slug === 'vendor') {
            $vendor = Vendor::where('user_id', $user->id)->first();
            if (!$vendor) return response()->json([]);
            $query->where('vendor_id', $vendor->id);
        }

        return response()->json($query->get());
    }

    /**
     * Vendor submits an invoice against a contract + IAR.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $vendor = Vendor::where('user_id', $user->id)->first();
        if (!$vendor) {
            return response()->json(['message' => 'Vendor profile not found.'], 404);
        }

        $validated = $request->validate([
            'contract_id' => 'required|exists:contracts,id',
            'iar_id' => 'required|exists:inspection_acceptance_reports,id',
            'invoice_number' => 'required|string|max:100|unique:invoices,invoice_number',
            'amount' => 'required|numeric|min:0.01',
            'remarks' => 'nullable|string|max:2000',
        ]);

        $contract = Contract::findOrFail($validated['contract_id']);
        if ($contract->vendor_id !== $vendor->id) {
            return response()->json(['message' => 'This contract does not belong to you.'], 403);
        }

        if ($contract->status !== 'active') {
            return response()->json(['message' => 'Invoices can only be submitted for active contracts.'], 400);
        }

        $iar = InspectionAcceptanceReport::findOrFail($validated['iar_id']);
        if ($iar->contract_id !== $contract->id) {
            return response()->json(['message' => 'IAR does not belong to this contract.'], 400);
        }
        if ($iar->status !== 'accepted') {
            return response()->json(['message' => 'IAR must be accepted before invoice submission.'], 400);
        }

        $invoice = Invoice::create([
            'contract_id' => $contract->id,
            'iar_id' => $iar->id,
            'vendor_id' => $vendor->id,
            'invoice_number' => $validated['invoice_number'],
            'amount' => $validated['amount'],
            'document_path' => 'simulated/invoices/' . $validated['invoice_number'] . '.pdf',
            'status' => 'submitted',
            'remarks' => $validated['remarks'] ?? null,
        ]);

        BlockchainEvent::recordEvent(
            'INVOICE_SUBMITTED',
            $user->id,
            Invoice::class,
            $invoice->id,
            null,
            ['contract_id' => $contract->id, 'amount' => $validated['amount']]
        );

        return response()->json(['message' => 'Invoice submitted.', 'invoice' => $invoice], 201);
    }

    /**
     * Finance officer validates an invoice (three-way match: Contract vs IAR vs Invoice).
     */
    public function validate(Request $request, Invoice $invoice)
    {
        if ($invoice->status !== 'submitted') {
            return response()->json(['message' => 'Invoice is not in submitted status.'], 400);
        }

        $contract = $invoice->contract;
        $iar = $invoice->inspectionReport;

        // Three-way match checks
        $matchResults = [
            'contract_match' => $contract && $invoice->contract_id === $contract->id,
            'iar_match' => $iar && $iar->contract_id === $contract->id && $iar->status === 'accepted',
            'amount_within_contract' => $invoice->amount <= $contract->contract_amount,
        ];

        $allMatch = !in_array(false, $matchResults, true);

        if (!$allMatch) {
            return response()->json([
                'message' => 'Three-way match failed.',
                'match_results' => $matchResults,
            ], 422);
        }

        DB::beginTransaction();
        try {
            $invoice->update([
                'status' => 'validated',
                'validated_by' => $request->user()->id,
                'validated_at' => now(),
            ]);

            BlockchainEvent::recordEvent(
                'INVOICE_VALIDATED',
                $request->user()->id,
                Invoice::class,
                $invoice->id,
                null,
                ['contract_id' => $contract->id, 'match_results' => $matchResults]
            );

            DB::commit();
            return response()->json(['message' => 'Invoice validated.', 'invoice' => $invoice->fresh(), 'match_results' => $matchResults]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Validation failed.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Finance officer rejects an invoice.
     */
    public function reject(Request $request, Invoice $invoice)
    {
        if ($invoice->status !== 'submitted') {
            return response()->json(['message' => 'Invoice is not in submitted status.'], 400);
        }

        $validated = $request->validate([
            'remarks' => 'required|string|min:10',
        ]);

        $invoice->update([
            'status' => 'rejected',
            'remarks' => $validated['remarks'],
        ]);

        return response()->json(['message' => 'Invoice rejected.', 'invoice' => $invoice->fresh()]);
    }

    /**
     * Mark invoice as paid.
     */
    public function markPaid(Request $request, Invoice $invoice)
    {
        if ($invoice->status !== 'validated') {
            return response()->json(['message' => 'Invoice must be validated before marking as paid.'], 400);
        }

        DB::beginTransaction();
        try {
            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            BlockchainEvent::recordEvent(
                'INVOICE_PAID',
                $request->user()->id,
                Invoice::class,
                $invoice->id,
                null,
                ['contract_id' => $invoice->contract_id, 'amount' => $invoice->amount]
            );

            // Anchor PAYMENT_RECORDED on Ethereum
            try {
                $bridge = app(EthereumBridgeService::class);
                $contract = $invoice->contract;
                $procurementId = (string) ($contract->purchase_requisition_id ?? $contract->id);
                $paymentHash = hash('sha256', "PAYMENT_{$invoice->id}_{$invoice->amount}");
                $bridge->anchorEvent($procurementId, $paymentHash, 5); // 5 = PAYMENT_RECORDED
            } catch (\Throwable $e) {
                \Log::warning("[Invoice] Ethereum anchoring skipped: {$e->getMessage()}");
            }

            DB::commit();
            return response()->json(['message' => 'Invoice marked as paid.', 'invoice' => $invoice->fresh()]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to mark as paid.', 'error' => $e->getMessage()], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\BAC;

use App\Http\Controllers\Controller;
use App\Models\BidSubmission;
use App\Models\Invitation;
use App\Models\BlockchainEvent;
use App\Services\EthereumBridgeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BidSubmissionController extends Controller
{
    public function index(Request $request)
    {
        $query = BidSubmission::with(['vendor', 'invitation']);

        if ($request->filled('invitation_id')) {
            $query->where('invitation_id', $request->invitation_id);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invitation_id' => 'required|exists:invitations,id',
            'bid_amount' => 'required|numeric|min:0.01',
            'documents' => 'required|array',
            'remarks' => 'nullable|string|max:2000',
        ]);

        $invitation = Invitation::findOrFail($validated['invitation_id']);

        // Hard deadline enforcement
        if (now()->gt($invitation->submission_deadline)) {
            return response()->json([
                'message' => 'Submission deadline has passed. No bids can be accepted after the deadline.',
            ], 403);
        }

        // Invitation status check
        if (!in_array($invitation->status, ['posted', 'sent'])) {
            return response()->json([
                'message' => 'Bids can only be submitted for posted or sent invitations.',
            ], 400);
        }

        $vendor = $request->user()->vendor;
        if (!$vendor) {
            return response()->json(['message' => 'No vendor profile found for this user.'], 400);
        }

        // Duplicate check
        $existing = BidSubmission::where('invitation_id', $invitation->id)
            ->where('vendor_id', $vendor->id)
            ->first();

        if ($existing && $existing->status !== 'submitted') {
            return response()->json(['message' => 'Your bid has already been processed and cannot be updated.'], 400);
        }

        DB::beginTransaction();
        try {
            $documentHash = hash('sha256', json_encode($validated['documents']));

            $submission = BidSubmission::updateOrCreate(
                [
                    'invitation_id' => $invitation->id,
                    'vendor_id' => $vendor->id,
                ],
                [
                    'bid_amount' => $validated['bid_amount'],
                    'documents' => $validated['documents'],
                    'remarks' => $validated['remarks'] ?? null,
                    'status' => 'submitted',
                    'submitted_at' => now(),
                    'is_late' => false,
                    'document_hash' => $documentHash,
                ]
            );

            // Generate sealed bid commitment for on-chain commit-reveal scheme
            $salt = bin2hex(random_bytes(32));
            $sealedCommitHash = hash('sha256', $validated['bid_amount'] . $salt);
            $submission->update([
                'sealed_commit_hash' => $sealedCommitHash,
                'sealed_salt' => encrypt($salt),
            ]);

            BlockchainEvent::recordEvent(
                BlockchainEvent::BID_SUBMITTED,
                $request->user()->id,
                BidSubmission::class,
                $submission->id,
                $documentHash,
                [
                    'procurement_id' => (string) $invitation->purchase_requisition_id,
                    'invitation_reference' => $invitation->reference_number,
                    'vendor_id' => $vendor->id,
                    'bid_amount' => $validated['bid_amount'],
                ]
            );

            // Anchor sealed bid on Ethereum (non-blocking — failure doesn't break flow)
            try {
                $bridge = app(EthereumBridgeService::class);
                $ethTx = $bridge->submitSealedBid(
                    (string) $invitation->purchase_requisition_id,
                    $sealedCommitHash
                );
                if ($ethTx) {
                    $submission->update(['on_chain_tx_hash' => $ethTx->tx_hash]);
                }
            } catch (\Throwable $e) {
                \Log::warning("[BidSubmission] Ethereum anchoring skipped: {$e->getMessage()}");
            }

            DB::commit();

            return response()->json([
                'message' => 'Bid submitted successfully.',
                'bid_submission' => $submission,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to submit bid.', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(BidSubmission $bidSubmission)
    {
        return response()->json($bidSubmission->load(['vendor', 'invitation']));
    }

    public function myBids(Request $request)
    {
        $vendor = $request->user()->vendor;
        if (!$vendor) {
            return response()->json(['data' => []]);
        }

        $bids = BidSubmission::with(['invitation'])
            ->where('vendor_id', $vendor->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $bids]);
    }
}

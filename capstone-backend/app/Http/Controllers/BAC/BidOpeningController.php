<?php

namespace App\Http\Controllers\BAC;

use App\Http\Controllers\Controller;
use App\Http\Requests\BAC\StoreBidOpeningRequest;
use App\Models\BidOpening;
use App\Models\BidEligibilityResult;
use App\Models\BidPrice;
use App\Models\BidOpeningAttendance;
use App\Models\Invitation;
use App\Models\PreBidConference;
use App\Models\BlockchainEvent;
use App\Services\DocumentRegistryService;
use App\Services\EthereumBridgeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BidOpeningController extends Controller
{
    /**
     * List bid opening sessions.
     */
    public function index(Request $request)
    {
        $query = BidOpening::with(['invitation', 'conductor']);
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    /**
     * Start a bid opening session.
     */
    public function store(StoreBidOpeningRequest $request)
    {
        $validated = $request->validated();

        $invitation = Invitation::findOrFail($validated['invitation_id']);

        // Check if session already exists for this invitation
        if (BidOpening::where('invitation_id', $invitation->id)->exists()) {
            return response()->json(['message' => 'A bid opening session already exists for this invitation.'], 400);
        }

        // Block if pre-bid conference is required but not finalized
        if ($invitation->pre_bid_conference_date) {
            $preBid = PreBidConference::where('invitation_id', $invitation->id)->first();
            if (!$preBid || $preBid->status !== 'minutes_finalized') {
                return response()->json(['message' => 'Pre-bid conference minutes must be finalized before bid opening can proceed.'], 400);
            }
        }

        DB::beginTransaction();
        try {
            $bidOpening = BidOpening::create([
                'invitation_id' => $invitation->id,
                'session_reference' => BidOpening::generateReference($invitation->reference_number ?? (string)$invitation->id),
                'session_date' => now(),
                'quorum_confirmed' => true, // Enforced by validation (min:3)
                'bac_members_present' => $validated['bac_members_present'],
                'observers_present' => $validated['observers_present'] ?? [],
                'status' => 'in_progress',
                'conducted_by' => $request->user()->id,
            ]);

            // Save basic bidder attendance if provided
            if (isset($validated['bidder_attendance'])) {
                foreach ($validated['bidder_attendance'] as $attendance) {
                    BidOpeningAttendance::create([
                        'bid_opening_id' => $bidOpening->id,
                        'vendor_id' => $attendance['vendor_id'],
                        'present' => $attendance['present'],
                    ]);
                }
            }

            // Record blockchain event
            $docHash = hash('sha256', json_encode($bidOpening->toArray()));
            BlockchainEvent::recordEvent(
                'BID_OPENING_STARTED',
                $request->user()->id,
                BidOpening::class,
                $bidOpening->id,
                $docHash,
                [
                    'procurement_id' => (string) $invitation->purchase_requisition_id,
                    'session_reference' => $bidOpening->session_reference,
                    'bac_members_count' => count($validated['bac_members_present']),
                ]
            );

            DB::commit();

            return response()->json([
                'message' => 'Bid opening session started successfully.',
                'bid_opening' => $bidOpening->load('attendance')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to start session.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Retrieve details of a bid opening session.
     */
    public function show(BidOpening $bidOpening)
    {
        return response()->json(
            $bidOpening->load(['invitation', 'conductor', 'attendance', 'eligibilityResults', 'bidPrices'])
        );
    }

    /**
     * Bulk update eligibility results for vendors.
     */
    public function updateEligibility(Request $request, BidOpening $bidOpening)
    {
        if ($bidOpening->status !== 'in_progress') {
            return response()->json(['message' => 'Cannot update eligibility. Session is not in progress.'], 400);
        }

        $validated = $request->validate([
            'results' => 'required|array',
            'results.*.vendor_id' => 'required|exists:vendors,id',
            'results.*.doc_type' => 'required|string',
            'results.*.result' => ['required', Rule::in(['pass', 'fail'])],
            'results.*.remarks' => 'nullable|string',
            'results.*.overall_eligible' => 'required|boolean',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['results'] as $result) {
                BidEligibilityResult::updateOrCreate(
                    [
                        'bid_opening_id' => $bidOpening->id,
                        'vendor_id' => $result['vendor_id'],
                        'doc_type' => $result['doc_type'],
                    ],
                    [
                        'result' => $result['result'],
                        'remarks' => $result['remarks'] ?? null,
                        'overall_eligible' => $result['overall_eligible'],
                    ]
                );
            }
            DB::commit();

            return response()->json([
                'message' => 'Eligibility results updated successfully.',
                'results' => $bidOpening->eligibilityResults
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update eligibility.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Record bid price as read for eligible bidders.
     */
    public function updateBidPrice(Request $request, BidOpening $bidOpening)
    {
        if ($bidOpening->status !== 'in_progress') {
            return response()->json(['message' => 'Cannot update bid prices. Session is not in progress.'], 400);
        }

        $validated = $request->validate([
            'prices' => 'required|array',
            'prices.*.vendor_id' => 'required|exists:vendors,id',
            'prices.*.amount_as_read' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['prices'] as $price) {
                // Ensure the bidder passed overall eligibility
                $isEligible = BidEligibilityResult::where('bid_opening_id', $bidOpening->id)
                    ->where('vendor_id', $price['vendor_id'])
                    ->where('overall_eligible', true)
                    ->exists();

                if (!$isEligible) {
                    throw new \Exception("Vendor ID {$price['vendor_id']} is not eligible to have a bid price recorded.");
                }

                BidPrice::updateOrCreate(
                    [
                        'bid_opening_id' => $bidOpening->id,
                        'vendor_id' => $price['vendor_id'],
                    ],
                    [
                        'amount_as_read' => $price['amount_as_read'],
                        'amount_as_calculated' => $price['amount_as_read'], // initially same as read
                    ]
                );
            }
            DB::commit();

            return response()->json([
                'message' => 'Bid prices recorded successfully.',
                'prices' => $bidOpening->bidPrices
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to record bid prices.', 'error' => $e->getMessage()], 400);
        }
    }

    /**
     * Generate the Abstract of Bids as Read.
     */
    public function generateAbstract(Request $request, BidOpening $bidOpening)
    {
        if ($bidOpening->status !== 'in_progress') {
            return response()->json(['message' => 'Session must be in progress.'], 400);
        }

        $bidOpening->load(['invitation', 'eligibilityResults.vendor', 'bidPrices.vendor', 'conductor']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.abstract-of-bids', [
            'bidOpening' => $bidOpening,
            'eligibleVendors' => $bidOpening->eligibilityResults->where('overall_eligible', true),
            'bidPrices' => $bidOpening->bidPrices->sortBy('amount_as_read'),
            'invitation' => $bidOpening->invitation,
        ]);

        $filename = "abstract-of-bids-{$bidOpening->session_reference}.pdf";
        $path = "abstracts/{$filename}";
        \Illuminate\Support\Facades\Storage::put($path, $pdf->output());

        $abstractHash = hash('sha256', $pdf->output());

        // Register document version
        $docService = app(DocumentRegistryService::class);
        $docService->register($bidOpening, 'abstract_as_read', $path, $request->user()->id, 'Abstract of Bids As Read');

        $validated = $request->validate([
            'session_minutes' => 'nullable|string|max:10000',
        ]);

        $bidOpening->update([
            'session_minutes' => $validated['session_minutes'] ?? $bidOpening->session_minutes,
        ]);

        return response()->json([
            'message' => 'Abstract of Bids As Read generated successfully.',
            'abstract_hash' => $abstractHash,
            'download_url' => url("storage/{$path}"),
        ]);
    }

    /**
     * Finalize and close the bid opening session.
     */
    public function closeSession(Request $request, BidOpening $bidOpening)
    {
        if (in_array($bidOpening->status, ['completed', 'failed'])) {
            return response()->json(['message' => 'Session is already closed or failed.'], 400);
        }

        DB::beginTransaction();
        try {
            // Auto-rank bid prices by amount_as_calculated ascending
            $prices = $bidOpening->bidPrices()->orderBy('amount_as_calculated')->get();
            foreach ($prices as $idx => $price) {
                $price->update(['rank' => $idx + 1]);
            }

            $bidOpening->update([
                'status' => 'completed',
                'closed_at' => now(),
            ]);

            $docHash = hash('sha256', json_encode($bidOpening->fresh()->load('bidPrices', 'eligibilityResults')->toArray()));

            BlockchainEvent::recordEvent(
                'BID_OPENING_COMPLETED',
                $request->user()->id,
                BidOpening::class,
                $bidOpening->id,
                $docHash,
                [
                    'procurement_id' => (string) ($bidOpening->invitation->purchase_requisition_id ?? ''),
                    'session_reference' => $bidOpening->session_reference,
                    'eligible_vendors' => $bidOpening->eligibilityResults()->where('overall_eligible', true)->pluck('vendor_id')->implode(','),
                    'ranked_prices' => $prices->pluck('rank', 'vendor_id')->toArray(),
                ]
            );

            // Anchor BID_OPENING_COMPLETED on Ethereum
            try {
                $bridge = app(EthereumBridgeService::class);
                $procurementId = (string) ($bidOpening->invitation->purchase_requisition_id ?? '');
                $bridge->anchorEvent($procurementId, $docHash, 2); // 2 = BID_OPENING_COMPLETED
            } catch (\Throwable $e) {
                \Log::warning("[BidOpening] Ethereum anchoring skipped: {$e->getMessage()}");
            }

            DB::commit();

            return response()->json([
                'message' => 'Bid opening session closed successfully.',
                'bid_opening' => $bidOpening
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to close session.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Declare failure of bidding.
     */
    public function declareFailure(Request $request, BidOpening $bidOpening)
    {
        if ($bidOpening->status === 'completed') {
            return response()->json(['message' => 'Session already successfully closed.'], 400);
        }

        $validated = $request->validate([
            'failure_grounds' => 'required|string|min:50',
        ]);

        DB::beginTransaction();
        try {
            $bidOpening->update([
                'status' => 'failed',
                'failure_declared' => true,
                'failure_grounds' => $validated['failure_grounds'],
                'closed_at' => now(),
            ]);

            BlockchainEvent::recordEvent(
                'FAILURE_OF_BIDDING',
                $request->user()->id,
                BidOpening::class,
                $bidOpening->id,
                hash('sha256', json_encode($bidOpening->fresh()->toArray())),
                [
                    'procurement_id' => (string) ($bidOpening->invitation->purchase_requisition_id ?? ''),
                    'session_reference' => $bidOpening->session_reference,
                    'grounds' => $validated['failure_grounds'],
                ]
            );

            DB::commit();

            return response()->json([
                'message' => 'Failure of bidding declared successfully.',
                'bid_opening' => $bidOpening
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to declare failure of bidding.', 'error' => $e->getMessage()], 500);
        }
    }
}

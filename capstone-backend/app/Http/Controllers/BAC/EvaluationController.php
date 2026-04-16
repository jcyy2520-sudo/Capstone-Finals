<?php

namespace App\Http\Controllers\BAC;

use App\Http\Controllers\Controller;
use App\Http\Requests\BAC\SubmitEvaluationRequest;
use App\Models\BidOpening;
use App\Models\Evaluation;
use App\Models\EvaluationSummary;
use App\Models\BidPrice;
use App\Models\Role;
use App\Models\BlockchainEvent;
use App\Services\DocumentRegistryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EvaluationController extends Controller
{
    /**
     * List all evaluation summaries with related bid opening and invitation data.
     */
    public function index(Request $request)
    {
        $summaries = EvaluationSummary::with(['bidOpening.invitation', 'approver'])
            ->orderByDesc('created_at')
            ->get();

        // Also include bid openings that are completed but have no evaluation yet
        $completedOpeningsWithoutEval = BidOpening::with('invitation')
            ->where('status', 'completed')
            ->whereDoesntHave('evaluationSummary')
            ->get();

        return response()->json([
            'evaluation_summaries' => $summaries,
            'pending_evaluation' => $completedOpeningsWithoutEval,
        ]);
    }

    /**
     * Submit an evaluation form by an evaluator (TWG / BAC Member).
     */
    public function submit(SubmitEvaluationRequest $request, BidOpening $bidOpening)
    {
        if ($bidOpening->status !== 'completed') {
            return response()->json(['message' => 'Bid opening must be completed before evaluation can begin.'], 400);
        }

        // Check evaluation summary is not already approved
        $summary = EvaluationSummary::where('bid_opening_id', $bidOpening->id)->first();
        if ($summary && $summary->status === 'approved') {
            return response()->json(['message' => 'Evaluation has already been approved.'], 400);
        }

        $validated = $request->validated();

        $evaluatorId = $request->user()->id;
        $evaluatorRole = $request->user()->role?->name;

        // Reject if role is neither twg_member nor bac_member
        if (!in_array($evaluatorRole, ['twg_member', 'bac_member'])) {
            return response()->json(['message' => 'Only TWG members and BAC members can submit evaluations.'], 403);
        }

        DB::beginTransaction();
        try {
            // Check if vendor actually passed physical eligibility check in opening phase
            $isEligible = $bidOpening->eligibilityResults()->where('vendor_id', $validated['vendor_id'])->where('overall_eligible', true)->exists();
            
            if (!$isEligible) {
                throw new \Exception("Vendor ID {$validated['vendor_id']} was not declared eligible in the opening session.");
            }

            // Ensure evaluation summary exists in in_progress state
            EvaluationSummary::firstOrCreate(
                ['bid_opening_id' => $bidOpening->id],
                ['invitation_id' => $bidOpening->invitation_id, 'status' => 'in_progress']
            );

            $evaluation = Evaluation::updateOrCreate(
                [
                    'bid_opening_id' => $bidOpening->id,
                    'evaluator_id' => $evaluatorId,
                    'vendor_id' => $validated['vendor_id'],
                ],
                [
                    'invitation_id' => $bidOpening->invitation_id,
                    'evaluator_role' => $evaluatorRole,
                    'technical_items' => $validated['technical_items'],
                    'calculated_price' => $validated['calculated_price'],
                    'arithmetic_correction_details' => $validated['arithmetic_correction_details'],
                    'recommendation' => $validated['recommendation'],
                    'overall_remarks' => $validated['overall_remarks'],
                    'status' => 'submitted',
                    'submitted_at' => now(),
                ]
            );

            DB::commit();

            return response()->json([
                'message' => 'Evaluation submitted successfully',
                'evaluation' => $evaluation
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to submit evaluation', 'error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get summary of all submitted evaluations for a bid opening.
     */
    public function summary(BidOpening $bidOpening)
    {
        $evaluations = Evaluation::with(['evaluator.role', 'vendor'])
            ->where('bid_opening_id', $bidOpening->id)
            ->get();

        $summary = EvaluationSummary::where('bid_opening_id', $bidOpening->id)->first();

        // Group evaluations by evaluator role
        $twgEvaluations = $evaluations->where('evaluator_role', 'twg_member')->values();
        $bacEvaluations = $evaluations->where('evaluator_role', 'bac_member')->values();

        return response()->json([
            'evaluations' => $evaluations,
            'twg_evaluations' => $twgEvaluations,
            'bac_evaluations' => $bacEvaluations,
            'summary' => $summary,
            'status' => $bidOpening->status,
        ]);
    }

    /**
     * Secretariat generates the Abstract of Bids As Calculated.
     * Enforces TWG requirement and compiles rankings.
     */
    public function generateAbstract(Request $request, BidOpening $bidOpening)
    {
        // Enforce TWG Requirement
        $twgEvaluatorExists = Evaluation::where('bid_opening_id', $bidOpening->id)
            ->where('evaluator_role', 'twg_member')
            ->exists();

        if (!$twgEvaluatorExists) {
            return response()->json(['message' => 'TWG submission is required before generating the Abstract of Bids as Calculated.'], 403);
        }

        DB::beginTransaction();
        try {
            // Aggregate best responsive calculated prices per vendor
            $vendorResults = Evaluation::where('bid_opening_id', $bidOpening->id)
                ->where('recommendation', 'responsive')
                ->selectRaw('vendor_id, AVG(calculated_price) as avg_calculated_price')
                ->groupBy('vendor_id')
                ->orderBy('avg_calculated_price', 'asc') // Lowest calculated price first
                ->get();

            $rankedBidders = [];
            $rank = 1;

            foreach ($vendorResults as $result) {
                $rankedBidders[] = [
                    'rank' => $rank,
                    'vendor_id' => $result->vendor_id,
                    'calculated_price' => $result->avg_calculated_price,
                ];

                // Update BidPrice record with new rank and calculated amount
                BidPrice::where('bid_opening_id', $bidOpening->id)
                    ->where('vendor_id', $result->vendor_id)
                    ->update([
                        'amount_as_calculated' => $result->avg_calculated_price,
                        'rank' => $rank
                    ]);

                $rank++;
            }

            // Generate Abstract of Bids As Calculated PDF
            $bidOpening->load(['invitation', 'eligibilityResults.vendor', 'bidPrices.vendor']);
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.abstract-of-bids-calculated', [
                'bidOpening' => $bidOpening,
                'invitation' => $bidOpening->invitation,
                'rankedBidders' => $rankedBidders,
                'vendorResults' => $vendorResults,
            ]);
            $filename = 'abstract-calculated-' . $bidOpening->session_reference . '.pdf';
            $path = 'abstracts/' . $filename;
            \Illuminate\Support\Facades\Storage::disk('public')->put($path, $pdf->output());
            $abstractHash = hash('sha256', $pdf->output());

            // Register document version
            $docService = app(DocumentRegistryService::class);
            $docService->register($bidOpening, 'abstract_as_calculated', $path, $request->user()->id, 'Abstract of Bids As Calculated');

            $summary = EvaluationSummary::updateOrCreate(
                ['bid_opening_id' => $bidOpening->id],
                [
                    'invitation_id' => $bidOpening->invitation_id,
                    'ranked_bidders' => $rankedBidders,
                    'abstract_as_calculated_path' => $path,
                    'status' => 'pending_chairperson_review',
                ]
            );

            DB::commit();

            return response()->json([
                'message' => 'Abstract of Bids As Calculated generated successfully.',
                'summary' => $summary,
                'abstract_hash' => $abstractHash
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to generate abstract', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Submit evaluation to chair.
     */
    public function submitToChair(Request $request, BidOpening $bidOpening)
    {
        $summary = EvaluationSummary::where('bid_opening_id', $bidOpening->id)->firstOrFail();

        if ($summary->status !== 'pending_chairperson_review') {
            return response()->json(['message' => 'Summary is not in a routable state.'], 400);
        }

        // Mark as pending review (same DB value, but this confirms formal transmittal)
        // The summary stays in pending_chairperson_review until approved
        return response()->json(['message' => 'Evaluation submitted to Chairperson for review.']);

        return response()->json(['message' => 'Evaluation submitted to Chairperson for review.']);
    }

    /**
     * BAC Chairperson signs/approves the evaluation report.
     */
    public function approve(Request $request, BidOpening $bidOpening)
    {
        $summary = EvaluationSummary::where('bid_opening_id', $bidOpening->id)->firstOrFail();

        if ($summary->status !== 'pending_chairperson_review') {
            return response()->json(['message' => 'Summary is not awaiting your approval.'], 400);
        }

        DB::beginTransaction();
        try {
            $reportHash = hash('sha256', json_encode($summary->toArray()));

            $summary->update([
                'status' => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            $bidOpening->update(['status' => 'EVALUATION_APPROVED']);

            BlockchainEvent::recordEvent(
                'EVALUATION_COMPLETED',
                $request->user()->id,
                EvaluationSummary::class,
                $summary->id,
                $reportHash,
                [
                    'bid_opening_id' => $bidOpening->id,
                    'session_reference' => $bidOpening->session_reference,
                    'lcb_vendor_id' => $summary->ranked_bidders[0]['vendor_id'] ?? null,
                ]
            );

            DB::commit();

            return response()->json([
                'message' => 'Evaluation approved successfully. Post-Qualification may now begin.',
                'summary' => $summary,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Approval failed.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Declare failure if no responsive bidders were found.
     */
    public function declareFailure(Request $request, BidOpening $bidOpening)
    {
        $validated = $request->validate([
            'failure_grounds' => 'required|string|min:50',
        ]);

        DB::beginTransaction();
        try {
            $summary = EvaluationSummary::updateOrCreate(
                ['bid_opening_id' => $bidOpening->id],
                [
                    'invitation_id' => $bidOpening->invitation_id,
                    'status' => 'failure_of_bidding',
                ]
            );

            BlockchainEvent::recordEvent(
                'EVALUATION_FAILURE',
                $request->user()->id,
                EvaluationSummary::class,
                $summary->id,
                hash('sha256', json_encode(['grounds' => $validated['failure_grounds'], 'bid_opening_id' => $bidOpening->id])),
                [
                    'bid_opening_id' => $bidOpening->id,
                    'session_reference' => $bidOpening->session_reference,
                    'phase' => 'evaluation',
                    'grounds' => $validated['failure_grounds'],
                ]
            );
            DB::commit();

            return response()->json(['message' => 'Failure of bidding declared at evaluation stage.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to declare failure.', 'error' => $e->getMessage()], 500);
        }
    }
}

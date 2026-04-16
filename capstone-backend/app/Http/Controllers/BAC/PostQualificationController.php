<?php

namespace App\Http\Controllers\BAC;

use App\Http\Controllers\Controller;
use App\Models\BidOpening;
use App\Models\EvaluationSummary;
use App\Models\PostQualification;
use App\Models\BacResolution;
use App\Models\BlockchainEvent;
use App\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class PostQualificationController extends Controller
{
    /**
     * List post-qualification work items.
     */
    public function index(Request $request)
    {
        $statuses = [
            'EVALUATION_APPROVED',
            'POST_QUALIFICATION_ONGOING',
            'POST_QUALIFICATION_FAILED',
            'POST_QUALIFICATION_PASSED',
            'BAC_RESOLUTION_SIGNED',
        ];

        $openingsQuery = BidOpening::with(['invitation', 'eligibilityResults.vendor', 'bidPrices', 'evaluationSummary'])
            ->whereIn('status', $statuses);

        $user = $request->user();
        $vendor = null;
        if ($user?->hasRole('vendor')) {
            $vendor = Vendor::where('user_id', $user->id)->first();
            if (!$vendor) {
                return response()->json([
                    'bid_openings' => [],
                    'post_qualifications' => [],
                    'bac_resolutions' => [],
                ]);
            }

            $openingsQuery->whereHas('postQualifications', function ($q) use ($vendor) {
                $q->where('vendor_id', $vendor->id);
            });
        }

        $openings = $openingsQuery->get();
        $openingIds = $openings->pluck('id');

        $pqQuery = PostQualification::with(['vendor', 'bacResolution'])
            ->whereIn('bid_opening_id', $openingIds)
            ->orderBy('rank');

        if ($vendor) {
            $pqQuery->where('vendor_id', $vendor->id);
        }

        $pqs = $pqQuery->get()->groupBy('bid_opening_id');
        $resolutions = BacResolution::whereIn('invitation_id', $openings->pluck('invitation_id')->unique())
            ->get()
            ->groupBy('invitation_id');

        return response()->json([
            'bid_openings' => $openings,
            'post_qualifications' => $pqs,
            'bac_resolutions' => $resolutions,
        ]);
    }

    /**
     * Initiate Post-Qualification invitation for the next ranked bidder.
     */
    public function initiate(Request $request, BidOpening $bidOpening)
    {
        if (!in_array($bidOpening->status, ['EVALUATION_APPROVED', 'POST_QUALIFICATION_FAILED', 'POST_QUALIFICATION_ONGOING'])) {
            return response()->json(['message' => 'Bid opening is not yet approved for post-qualification.'], 400);
        }

        $summary = EvaluationSummary::where('bid_opening_id', $bidOpening->id)->firstOrFail();
        $rankedBidders = collect($summary->ranked_bidders)->sortBy('rank')->values()->all();

        if (empty($rankedBidders)) {
            return response()->json(['message' => 'No ranked bidders found.'], 400);
        }

        $processedRanks = PostQualification::where('bid_opening_id', $bidOpening->id)
            ->pluck('rank')
            ->all();

        $targetBidder = null;
        foreach ($rankedBidders as $candidate) {
            if (!in_array($candidate['rank'], $processedRanks, true)) {
                $targetBidder = $candidate;
                break;
            }
        }

        if (!$targetBidder) {
            return response()->json(['message' => 'All ranked bidders have already been processed.'], 400);
        }

        DB::beginTransaction();
        try {
            $now = now();
            $invitationReference = sprintf('PQI-%s-%05d', $now->format('Y'), PostQualification::count() + 1);

            $pq = PostQualification::create([
                'bid_opening_id' => $bidOpening->id,
                'invitation_id' => $bidOpening->invitation_id,
                'vendor_id' => $targetBidder['vendor_id'],
                'rank' => $targetBidder['rank'],
                'invitation_reference' => $invitationReference,
                'result' => 'pending',
                'workflow_status' => 'invitation_sent',
                'required_documents' => $this->defaultRequiredDocuments($bidOpening->invitation?->mode),
                'invitation_sent_at' => $now,
                'submission_deadline_at' => $now->copy()->addDays(5),
            ]);

            $bidOpening->update(['status' => 'POST_QUALIFICATION_ONGOING']);

            BlockchainEvent::recordEvent(
                'POST_QUAL_INVITATION_SENT',
                $request->user()->id,
                PostQualification::class,
                $pq->id,
                null,
                [
                    'bid_opening_id' => $bidOpening->id,
                    'vendor_id' => $pq->vendor_id,
                    'rank' => $pq->rank,
                    'deadline_at' => optional($pq->submission_deadline_at)->toIso8601String(),
                ]
            );

            DB::commit();

            return response()->json([
                'message' => "Post-Qualification initiated for Rank {$pq->rank} bidder.",
                'post_qualification' => $pq
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to initiate post-qualification', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Vendor acknowledges invitation and activates legal 5-day countdown from acknowledgment.
     */
    public function acknowledge(Request $request, PostQualification $postQualification)
    {
        $vendor = Vendor::where('user_id', $request->user()->id)->first();
        if ($vendor && $postQualification->vendor_id !== $vendor->id) {
            return response()->json(['message' => 'Unauthorized invitation access.'], 403);
        }

        $ackAt = now();
        $postQualification->update([
            'acknowledged_at' => $ackAt,
            'submission_deadline_at' => $ackAt->copy()->addDays(5),
            'workflow_status' => 'acknowledged',
        ]);

        return response()->json([
            'message' => 'Post-qualification invitation acknowledged.',
            'post_qualification' => $postQualification->fresh(),
        ]);
    }

    /**
     * Vendor submits post-qualification documents.
     */
    public function vendorSubmit(Request $request, PostQualification $postQualification)
    {
        $vendor = Vendor::where('user_id', $request->user()->id)->first();
        if ($vendor && $postQualification->vendor_id !== $vendor->id) {
            return response()->json(['message' => 'Unauthorized post-qualification submission.'], 403);
        }

        if (in_array($postQualification->workflow_status, ['passed', 'failed', 'resolution_finalized'])) {
            return response()->json(['message' => 'Submission is already finalized for this post-qualification iteration.'], 400);
        }

        $validated = $request->validate([
            'files' => 'sometimes|array',
            'files.*' => 'file|mimes:pdf|max:25600',
            'attestation_confirmed' => 'sometimes|boolean',
            'missing_document_explanation' => 'nullable|string',
        ]);

        $deadline = $postQualification->extension_deadline_at ?? $postQualification->submission_deadline_at;
        if ($deadline && now()->greaterThan($deadline)) {
            $postQualification->update([
                'workflow_status' => 'non_compliant',
                'non_compliance_reason' => 'Submission attempted beyond the 5-calendar-day post-qualification deadline.',
            ]);

            return response()->json(['message' => 'Submission window has lapsed. Bidder marked non-compliant.'], 422);
        }

        DB::beginTransaction();
        try {
            $submittedDocuments = [];

            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $docType => $file) {
                    $storedPath = $file->store("post-qualification/{$postQualification->id}", 'local');
                    $submittedDocuments[] = [
                        'doc_type' => (string) $docType,
                        'original_name' => $file->getClientOriginalName(),
                        'path' => $storedPath,
                        'size' => $file->getSize(),
                        'mime' => $file->getMimeType(),
                        'hash' => hash_file('sha256', $file->getRealPath()),
                        'uploaded_at' => now()->toIso8601String(),
                    ];
                }
            } else {
                // Backward-compatible fallback for existing simulate button.
                $submittedDocuments = $postQualification->submitted_documents ?: [
                    [
                        'doc_type' => 'simulated_tax_clearance',
                        'original_name' => 'tax-clearance.pdf',
                        'path' => "post-qualification/{$postQualification->id}/simulated-tax-clearance.pdf",
                        'hash' => hash('sha256', 'simulated-tax-clearance-' . $postQualification->id),
                        'uploaded_at' => now()->toIso8601String(),
                    ],
                ];
            }

            $postQualification->update([
                'submitted_documents' => $submittedDocuments,
                'documents_submitted_at' => now(),
                'workflow_status' => 'submitted',
            ]);

            BlockchainEvent::recordEvent(
                'POST_QUAL_DOCUMENTS_SUBMITTED',
                $request->user()->id,
                PostQualification::class,
                $postQualification->id,
                null,
                [
                    'vendor_id' => $postQualification->vendor_id,
                    'document_count' => count($submittedDocuments),
                ]
            );

            DB::commit();

            return response()->json([
                'message' => 'Post-Qualification documents submitted successfully.',
                'post_qualification' => $postQualification->fresh()
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to submit documents.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * BAC/TWG evaluates the submitted documents.
     */
    public function evaluate(Request $request, PostQualification $postQualification)
    {
        if ($postQualification->documents_submitted_at === null) {
            return response()->json(['message' => 'Waiting for vendor to submit documents.'], 400);
        }

        if (in_array($postQualification->result, ['passed', 'failed'])) {
            return response()->json(['message' => 'This post-qualification iteration is already evaluated.'], 400);
        }

        $validated = $request->validate([
            'result' => ['required', Rule::in(['pass', 'fail'])],
            'failure_reason' => 'required_if:result,fail|nullable|string',
            'twg_remarks' => 'nullable|string',
            'checklist_results' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $resultEnum = $validated['result'] === 'pass' ? 'passed' : 'failed';

            $postQualification->update([
                'twg_evaluation' => $validated['checklist_results'] ?? null,
                'twg_recommendation' => $validated['result'],
                'twg_remarks' => $validated['twg_remarks'] ?? null,
                'result' => $resultEnum,
                'workflow_status' => $validated['result'] === 'pass' ? 'passed' : 'failed',
                'failure_reason' => $validated['result'] === 'fail' ? ($validated['failure_reason'] ?? null) : null,
                'non_compliance_reason' => $validated['result'] === 'fail' ? ($validated['failure_reason'] ?? null) : null,
                'evaluated_by' => $request->user()->id,
                'completed_at' => now(),
            ]);

            $bidOpening = $postQualification->bidOpening;

            if ($validated['result'] === 'pass') {
                $resolution = BacResolution::create([
                    'resolution_reference' => 'BAC-RES-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4)),
                    'invitation_id' => $postQualification->invitation_id,
                    'type' => 'lcrb_declaration',
                    'subject' => 'Declaring Lowest Calculated Responsive Bid (LCRB)',
                    'body' => "Post-qualification result for Vendor ID {$postQualification->vendor_id} is PASS. BAC may route this for HOPE action.",
                    'signatories' => [],
                    'min_signatures_required' => 3,
                    'status' => 'draft',
                    'created_by' => $request->user()->id,
                ]);

                $postQualification->update([
                    'bac_resolution_id' => $resolution->id,
                    'workflow_status' => 'resolution_draft',
                ]);

                $bidOpening->update(['status' => 'POST_QUALIFICATION_PASSED']);

                BlockchainEvent::recordEvent(
                    'POST_QUAL_COMPLETED',
                    $request->user()->id,
                    PostQualification::class,
                    $postQualification->id,
                    null,
                    [
                        'result' => 'passed',
                        'vendor_id' => $postQualification->vendor_id,
                        'bac_resolution_id' => $resolution->id,
                    ]
                );
                
                DB::commit();
                return response()->json([
                    'message' => 'Post-Qualification PASSED. LCRB identified. Draft BAC Resolution created.',
                    'post_qualification' => $postQualification->fresh(),
                    'bac_resolution' => $resolution
                ]);
            } else {
                $bidOpening->update(['status' => 'POST_QUALIFICATION_FAILED']);

                BlockchainEvent::recordEvent(
                    'POST_QUAL_COMPLETED',
                    $request->user()->id,
                    PostQualification::class,
                    $postQualification->id,
                    null,
                    [
                        'result' => 'failed',
                        'vendor_id' => $postQualification->vendor_id,
                        'failure_reason' => $validated['failure_reason'] ?? null,
                    ]
                );
                
                DB::commit();
                return response()->json([
                    'message' => 'Post-Qualification FAILED. Proceed to initiate for the next ranked bidder.',
                    'post_qualification' => $postQualification->fresh()
                ]);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Evaluation failed.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Finalize BAC Resolution after collecting required signatures or aggregated sign-off.
     */
    public function finalizeResolution(Request $request, BacResolution $bacResolution)
    {
        if (!in_array($bacResolution->status, ['draft', 'pending_signatures'])) {
            return response()->json(['message' => 'Resolution is already finalized.'], 400);
        }

        $validated = $request->validate([
            'aggregated_signed_boolean' => 'nullable|boolean',
            'signatory_user_ids' => 'nullable|array',
            'signatory_user_ids.*' => 'integer|exists:users,id',
        ]);

        DB::beginTransaction();
        try {
            $resHash = hash('sha256', "BAC_RES_{$bacResolution->id}_FINALIZED_" . time());
            $existing = collect($bacResolution->signatories ?? []);

            $existingIds = $existing->pluck('user_id')->filter()->values()->all();
            $incomingIds = collect($validated['signatory_user_ids'] ?? [])->filter()->values()->all();

            if (!in_array($request->user()->id, $incomingIds, true) && !in_array($request->user()->id, $existingIds, true)) {
                $incomingIds[] = $request->user()->id;
            }

            $allIds = collect(array_merge($existingIds, $incomingIds))->unique()->values();
            $signatories = $allIds->map(fn ($id) => [
                'user_id' => $id,
                'signed_at' => now()->toIso8601String(),
            ])->values()->all();

            $aggregatedSigned = (bool) ($validated['aggregated_signed_boolean'] ?? false);
            $hasRequiredSignatures = count($allIds) >= $bacResolution->min_signatures_required;

            $newStatus = ($hasRequiredSignatures || $aggregatedSigned) ? 'signed' : 'pending_signatures';

            $bacResolution->update([
                'status' => $newStatus,
                'signatories' => $signatories,
                'document_hash' => $resHash,
            ]);

            $bidOpening = BidOpening::where('invitation_id', $bacResolution->invitation_id)->first();
            if ($bidOpening && $newStatus === 'signed') {
                $bidOpening->update(['status' => 'BAC_RESOLUTION_SIGNED']);
            }

            if ($newStatus === 'signed') {
                PostQualification::where('bac_resolution_id', $bacResolution->id)->update([
                    'workflow_status' => 'resolution_finalized',
                    'finalized_at' => now(),
                ]);
            }

            BlockchainEvent::recordEvent(
                'BAC_RESOLUTION_COMPLETED',
                $request->user()->id,
                BacResolution::class,
                $bacResolution->id,
                $resHash,
                [
                    'status' => $newStatus,
                    'signatory_count' => count($allIds),
                    'required_signatures' => $bacResolution->min_signatures_required,
                ]
            );

            DB::commit();

            return response()->json([
                'message' => $newStatus === 'signed'
                    ? 'BAC Resolution finalized successfully.'
                    : 'Resolution saved. Additional signatures are still required.',
                'bac_resolution' => $bacResolution->fresh(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to finalize resolution.', 'error' => $e->getMessage()], 500);
        }
    }

    private function defaultRequiredDocuments(?string $mode): array
    {
        $base = [
            ['code' => 'tax_clearance', 'label' => 'Latest Tax Clearance', 'required' => true],
            ['code' => 'philgeps_certificate', 'label' => 'PhilGEPS Registration Certificate', 'required' => true],
            ['code' => 'audited_fs', 'label' => 'Audited Financial Statements', 'required' => true],
            ['code' => 'ongoing_contracts', 'label' => 'Statement of Ongoing Contracts', 'required' => true],
            ['code' => 'slcc', 'label' => 'Statement of SLCC', 'required' => true],
        ];

        if (in_array($mode, ['competitive_bidding', 'small_value_procurement'])) {
            $base[] = ['code' => 'bid_security', 'label' => 'Bid Security Document', 'required' => true];
        }

        return $base;
    }
}

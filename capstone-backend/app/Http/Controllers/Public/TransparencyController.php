<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Award;
use App\Models\BidOpening;
use App\Models\BidPrice;
use App\Models\BidSubmission;
use App\Models\BlockchainEvent;
use App\Models\Contract;
use App\Models\DocumentVersion;
use App\Models\EthereumTransaction;
use App\Models\EvaluationSummary;
use App\Models\Invitation;
use App\Models\PurchaseRequisition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TransparencyController extends Controller
{
    /**
     * Paginated list of public procurements with search and filter.
     */
    public function index(Request $request)
    {
        $query = Invitation::with(['purchaseRequisition.department'])
            ->whereNotIn('status', ['draft']);

        // Search by title or reference
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                  ->orWhereHas('purchaseRequisition', function ($prQ) use ($search) {
                      $prQ->where('project_title', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by procurement mode
        if ($request->filled('mode')) {
            $query->where('procurement_mode', $request->mode);
        }

        $paginated = $query->orderByDesc('created_at')->paginate(30);

        // Pre-posting statuses that are "In Preparation"
        $preparationStatuses = ['pending_chairperson_approval', 'pending_hope_approval', 'approved'];

        // Sanitize for public consumption
        $paginated->getCollection()->transform(function ($invitation) use ($preparationStatuses) {
            $pr = $invitation->purchaseRequisition;

            // Determine public phase
            if (in_array($invitation->status, $preparationStatuses)) {
                $publicPhase = 'preparation';
            } elseif ($invitation->status === 'returned') {
                $publicPhase = 'returned';
            } else {
                $publicPhase = 'active';
            }

            // Preparation: limited info only
            if ($publicPhase === 'preparation') {
                return [
                    'reference_number' => $invitation->reference_number,
                    'project_title' => $invitation->project_title ?? 'N/A',
                    'department' => $pr?->department?->name ?? 'N/A',
                    'procurement_mode' => $invitation->procurement_mode,
                    'status' => $invitation->status,
                    'public_phase' => $publicPhase,
                ];
            }

            // Returned: title, department, return_remarks only
            if ($publicPhase === 'returned') {
                return [
                    'reference_number' => $invitation->reference_number,
                    'project_title' => $invitation->project_title ?? 'N/A',
                    'department' => $pr?->department?->name ?? 'N/A',
                    'procurement_mode' => $invitation->procurement_mode,
                    'status' => $invitation->status,
                    'return_remarks' => $invitation->return_remarks,
                    'public_phase' => $publicPhase,
                ];
            }

            // Active (posted and beyond): full card data
            $award = Award::where('invitation_id', $invitation->id)
                ->whereNotIn('status', ['DRAFT'])
                ->first();
            $contract = $award ? Contract::where('award_id', $award->id)->first() : null;
            $bidCount = BidSubmission::where('invitation_id', $invitation->id)->count();

            // Compute lifecycle progress
            $lifecycle = self::getLifecycleForMode($invitation->procurement_mode);
            $completedEvents = BlockchainEvent::where('procurement_id', (string) $invitation->purchase_requisition_id)
                ->pluck('event_type')
                ->unique()
                ->toArray();
            $completedMilestones = collect($lifecycle)->filter(fn ($step) => in_array($step['event'], $completedEvents))->count();

            return [
                'reference_number' => $invitation->reference_number,
                'project_title' => $invitation->project_title ?? 'N/A',
                'department' => $pr?->department?->name ?? 'N/A',
                'procurement_mode' => $invitation->procurement_mode,
                'abc' => $invitation->abc ?? 0,
                'status' => $invitation->status,
                'posted_at' => $invitation->posted_at,
                'submission_deadline' => $invitation->submission_deadline,
                'bid_count' => $bidCount,
                'winner' => $award?->vendor?->business_name ?? null,
                'contract_amount' => $contract?->contract_amount ?? null,
                'contract_status' => $contract?->status ?? null,
                'philgeps_reference' => $invitation->philgeps_reference,
                'lifecycle_steps' => count($lifecycle),
                'lifecycle_completed' => $completedMilestones,
                'public_phase' => $publicPhase,
            ];
        });

        return response()->json($paginated);
    }

    /**
     * Single procurement detail by reference number.
     */
    public function show(string $reference)
    {
        $invitation = Invitation::with(['purchaseRequisition.department'])
            ->where('reference_number', $reference)
            ->whereNotIn('status', ['draft'])
            ->firstOrFail();

        $pr = $invitation->purchaseRequisition;
        $preparationStatuses = ['pending_chairperson_approval', 'pending_hope_approval', 'approved'];

        // Determine public phase
        if (in_array($invitation->status, $preparationStatuses)) {
            return response()->json([
                'reference_number' => $invitation->reference_number,
                'project_title' => $invitation->project_title ?? 'N/A',
                'department' => $pr?->department?->name ?? 'N/A',
                'procurement_mode' => $invitation->procurement_mode,
                'status' => $invitation->status,
                'public_phase' => 'preparation',
            ]);
        }

        if ($invitation->status === 'returned') {
            return response()->json([
                'reference_number' => $invitation->reference_number,
                'project_title' => $invitation->project_title ?? 'N/A',
                'department' => $pr?->department?->name ?? 'N/A',
                'procurement_mode' => $invitation->procurement_mode,
                'status' => $invitation->status,
                'return_remarks' => $invitation->return_remarks,
                'public_phase' => 'returned',
            ]);
        }

        $award = Award::with('vendor')->where('invitation_id', $invitation->id)->first();
        $contract = $award ? Contract::where('award_id', $award->id)->first() : null;
        $bidOpening = BidOpening::where('invitation_id', $invitation->id)->first();

        // Build full lifecycle with completion data
        $lifecycle = self::getLifecycleForMode($invitation->procurement_mode);
        $procurementId = (string) $invitation->purchase_requisition_id;
        $events = BlockchainEvent::with(['actor', 'actor.role'])
            ->where('procurement_id', $procurementId)
            ->orderBy('block_number')
            ->get();

        // Map events by type (first occurrence = the milestone event)
        $eventMap = [];
        $subEvents = [];
        $milestoneTypes = collect($lifecycle)->pluck('event')->toArray();

        foreach ($events as $event) {
            if (in_array($event->event_type, $milestoneTypes)) {
                if (!isset($eventMap[$event->event_type])) {
                    $eventMap[$event->event_type] = $event;
                } else {
                    $subEvents[] = $event;
                }
            } else {
                $subEvents[] = $event;
            }
        }

        // Build lifecycle response with status per step
        $currentFound = false;
        $lifecycleData = [];
        foreach ($lifecycle as $step) {
            $matchedEvent = $eventMap[$step['event']] ?? null;
            if ($matchedEvent) {
                $roleName = $matchedEvent->actor?->role?->name;
                $roleLabel = $roleName ? ucwords(str_replace('_', ' ', $roleName)) : null;

                $stepData = [
                    'event' => $step['event'],
                    'label' => $step['label'],
                    'status' => 'completed',
                    'completed_at' => $matchedEvent->recorded_at,
                    'actor_name' => $matchedEvent->actor?->name ?? 'System',
                    'actor_role' => $roleLabel,
                    'block_hash' => $matchedEvent->block_hash,
                    'eth_tx_hash' => $matchedEvent->eth_tx_hash,
                ];

                // Attach budget amount on BUDGET_CERTIFIED step
                if ($step['event'] === 'BUDGET_CERTIFIED') {
                    $stepData['budget_amount'] = $invitation->abc;
                }
                // Attach contract amount on CONTRACT_SIGNED step
                if ($step['event'] === 'CONTRACT_SIGNED' && $contract) {
                    $stepData['contract_amount'] = $contract->contract_amount;
                }

                $lifecycleData[] = $stepData;
            } else {
                $status = $currentFound ? 'pending' : 'current';
                $currentFound = true;

                $lifecycleData[] = [
                    'event' => $step['event'],
                    'label' => $step['label'],
                    'status' => $status,
                    'completed_at' => null,
                    'actor_name' => null,
                    'actor_role' => null,
                    'block_hash' => null,
                    'eth_tx_hash' => null,
                ];
            }
        }

        // Sub-events (non-milestone blockchain events like BID_SUBMITTED, DOCUMENT_REGISTERED)
        $subEventData = collect($subEvents)->map(function ($e) {
            $roleName = $e->actor?->role?->name;
            return [
                'event_type' => $e->event_type,
                'actor_name' => $e->actor?->name ?? 'System',
                'actor_role' => $roleName ? ucwords(str_replace('_', ' ', $roleName)) : null,
                'recorded_at' => $e->recorded_at,
                'block_hash' => $e->block_hash,
                'eth_tx_hash' => $e->eth_tx_hash,
            ];
        })->values();

        return response()->json([
            'reference_number' => $invitation->reference_number,
            'project_title' => $invitation->project_title ?? 'N/A',
            'department' => $pr?->department?->name ?? 'N/A',
            'procurement_mode' => $invitation->procurement_mode,
            'abc' => $invitation->abc ?? 0,
            'status' => $invitation->status,
            'philgeps_reference' => $invitation->philgeps_reference,
            'posted_at' => $invitation->posted_at,
            'submission_deadline' => $invitation->submission_deadline,
            'bid_opening_date' => $bidOpening?->session_date,
            'award' => $award ? [
                'noa_reference' => $award->noa_reference,
                'vendor' => $award->vendor?->business_name,
                'contract_amount' => $award->contract_amount,
                'status' => $award->status,
                'noa_issued_at' => $award->noa_issued_at,
            ] : null,
            'contract' => $contract ? [
                'contract_reference' => $contract->contract_reference,
                'contract_amount' => $contract->contract_amount,
                'ntp_date' => $contract->ntp_date,
                'end_date' => $contract->end_date,
                'duration_days' => $contract->duration_days,
                'status' => $contract->status,
                'progress_percentage' => $contract->progress_percentage,
            ] : null,
            'lifecycle' => $lifecycleData,
            'sub_events' => $subEventData,
            'public_phase' => 'active',
        ]);
    }

    /**
     * Blockchain event timeline for a procurement.
     */
    public function timeline(string $reference)
    {
        $invitation = Invitation::where('reference_number', $reference)
            ->whereNotIn('status', ['draft'])
            ->firstOrFail();

        $procurementId = (string) $invitation->purchase_requisition_id;

        $events = BlockchainEvent::with('actor')
            ->where('procurement_id', $procurementId)
            ->orderBy('block_number')
            ->get()
            ->map(function ($event) {
                return [
                    'block_number' => $event->block_number,
                    'event_type' => $event->event_type,
                    'actor_name' => $event->actor?->name ?? 'System',
                    'block_hash' => $event->block_hash,
                    'eth_tx_hash' => $event->eth_tx_hash,
                    'document_hash' => $event->document_hash,
                    'recorded_at' => $event->recorded_at,
                ];
            });

        return response()->json(['data' => $events]);
    }

    /**
     * Bids for a procurement (only visible after bid opening completed).
     */
    public function bids(string $reference)
    {
        $invitation = Invitation::where('reference_number', $reference)
            ->whereNotIn('status', ['draft'])
            ->firstOrFail();

        $bidOpening = BidOpening::where('invitation_id', $invitation->id)
            ->whereIn('status', ['completed', 'failed'])
            ->first();

        if (!$bidOpening) {
            return response()->json([
                'message' => 'Bid details are not yet available. The bid opening has not been completed.',
                'data' => [],
            ]);
        }

        $bids = BidSubmission::with('vendor')
            ->where('invitation_id', $invitation->id)
            ->orderBy('bid_amount')
            ->get()
            ->map(function ($bid) use ($invitation) {
                $award = Award::where('invitation_id', $invitation->id)
                    ->where('vendor_id', $bid->vendor_id)
                    ->first();

                return [
                    'vendor_name' => $bid->vendor?->business_name ?? 'N/A',
                    'bid_amount' => $bid->bid_amount,
                    'status' => $bid->status,
                    'document_hash' => $bid->document_hash,
                    'submitted_at' => $bid->submitted_at,
                    'is_winner' => $award !== null && !in_array($award->status, ['DRAFT', 'CANCELLED']),
                ];
            });

        return response()->json(['data' => $bids]);
    }

    /**
     * Full blockchain trail for a procurement.
     */
    public function blockchainTrail(string $reference)
    {
        $invitation = Invitation::where('reference_number', $reference)
            ->whereNotIn('status', ['draft'])
            ->firstOrFail();

        $procurementId = (string) $invitation->purchase_requisition_id;

        $events = BlockchainEvent::where('procurement_id', $procurementId)
            ->orderBy('block_number')
            ->get()
            ->map(function ($event) {
                return [
                    'block_number' => $event->block_number,
                    'event_type' => $event->event_type,
                    'block_hash' => $event->block_hash,
                    'previous_hash' => $event->previous_hash,
                    'metadata_hash' => $event->metadata_hash,
                    'document_hash' => $event->document_hash,
                    'eth_tx_hash' => $event->eth_tx_hash,
                    'recorded_at' => $event->recorded_at,
                ];
            });

        return response()->json(['data' => $events]);
    }

    /**
     * Chain integrity verification.
     */
    public function verifyChain()
    {
        $result = BlockchainEvent::verifyChainIntegrity();

        return response()->json([
            'valid' => $result['intact'],
            'blocks_checked' => $result['total_blocks'],
            'errors' => count($result['issues']),
            'issues' => $result['issues'],
        ]);
    }

    /**
     * Verify a single blockchain event by block number.
     */
    public function verifyEvent(int $blockNumber)
    {
        $event = BlockchainEvent::where('block_number', $blockNumber)->firstOrFail();

        // Check chain link
        $previousBlock = BlockchainEvent::where('block_number', $blockNumber - 1)->first();
        $chainValid = true;

        if ($blockNumber === 1) {
            $chainValid = $event->previous_hash === str_repeat('0', 64);
        } elseif ($previousBlock) {
            $chainValid = $event->previous_hash === $previousBlock->block_hash;
        }

        // Check on-chain status
        $onChainStatus = null;
        if ($event->eth_tx_hash) {
            $ethTx = EthereumTransaction::where('tx_hash', $event->eth_tx_hash)->first();
            $onChainStatus = $ethTx?->status ?? 'unknown';
        }

        return response()->json([
            'block_number' => $event->block_number,
            'event_type' => $event->event_type,
            'block_hash' => $event->block_hash,
            'previous_hash' => $event->previous_hash,
            'chain_link_valid' => $chainValid,
            'eth_tx_hash' => $event->eth_tx_hash,
            'on_chain_status' => $onChainStatus,
            'recorded_at' => $event->recorded_at,
        ]);
    }

    /**
     * Aggregate statistics for the public dashboard.
     */
    public function statistics()
    {
        $totalProcurements = Invitation::whereNotIn('status', ['draft', 'returned'])->count();
        $totalContractValue = Contract::sum('contract_amount');
        $activeBids = Invitation::whereIn('status', ['posted', 'sent'])->count();
        $completedProjects = Contract::where('status', 'completed')->count();
        $totalBlockchainEvents = BlockchainEvent::count();

        return response()->json([
            'total_procurements' => $totalProcurements,
            'total_contract_value' => $totalContractValue,
            'active_bids' => $activeBids,
            'completed_projects' => $completedProjects,
            'total_blockchain_events' => $totalBlockchainEvents,
        ]);
    }

    /**
     * Upcoming procurement dates for the public calendar.
     */
    public function calendar(Request $request)
    {
        $now = now();

        $invitations = Invitation::with(['purchaseRequisition.department'])
            ->whereIn('status', ['posted', 'sent'])
            ->where(function ($q) use ($now) {
                $q->where('submission_deadline', '>=', $now)
                  ->orWhere('opening_date', '>=', $now)
                  ->orWhere('pre_bid_conference_date', '>=', $now)
                  ->orWhere('eligibility_check_date', '>=', $now);
            })
            ->orderBy('submission_deadline')
            ->get();

        $events = [];

        foreach ($invitations as $invitation) {
            $pr = $invitation->purchaseRequisition;
            $base = [
                'reference_number' => $invitation->reference_number,
                'project_title' => $invitation->project_title ?? 'N/A',
                'department' => $pr?->department?->name ?? 'N/A',
                'procurement_mode' => $invitation->procurement_mode,
            ];

            if ($invitation->submission_deadline && $invitation->submission_deadline >= $now) {
                $events[] = array_merge($base, [
                    'date' => $invitation->submission_deadline->toIso8601String(),
                    'event_type' => 'submission_deadline',
                    'event_label' => 'Submission Deadline',
                ]);
            }
            if ($invitation->opening_date && $invitation->opening_date >= $now) {
                $events[] = array_merge($base, [
                    'date' => $invitation->opening_date->toIso8601String(),
                    'event_type' => 'opening_date',
                    'event_label' => 'Bid Opening',
                ]);
            }
            if ($invitation->pre_bid_conference_date && $invitation->pre_bid_conference_date >= $now) {
                $events[] = array_merge($base, [
                    'date' => $invitation->pre_bid_conference_date->toIso8601String(),
                    'event_type' => 'pre_bid_conference',
                    'event_label' => 'Pre-Bid Conference',
                ]);
            }
            if ($invitation->eligibility_check_date && $invitation->eligibility_check_date >= $now) {
                $events[] = array_merge($base, [
                    'date' => $invitation->eligibility_check_date->toIso8601String(),
                    'event_type' => 'eligibility_check',
                    'event_label' => 'Eligibility Check',
                ]);
            }
        }

        // Sort all events by date
        usort($events, fn ($a, $b) => strcmp($a['date'], $b['date']));

        return response()->json(['data' => $events]);
    }

    /**
     * Mode-aware lifecycle definitions.
     * Returns the ordered list of milestone events for a given procurement mode.
     */
    public static function getLifecycleForMode(string $mode): array
    {
        $competitiveBidding = [
            ['event' => 'APP_APPROVED', 'label' => 'APP Approved'],
            ['event' => 'PR_ACCEPTED', 'label' => 'Purchase Request Accepted'],
            ['event' => 'BUDGET_CERTIFIED', 'label' => 'Budget Certified'],
            ['event' => 'PRE_PROCUREMENT_CONFERENCE_APPROVED', 'label' => 'Pre-Procurement Conference'],
            ['event' => 'ITB_POSTED', 'label' => 'Invitation to Bid Posted'],
            ['event' => 'BID_OPENING_COMPLETED', 'label' => 'Bid Opening'],
            ['event' => 'EVALUATION_COMPLETED', 'label' => 'Bid Evaluation'],
            ['event' => 'POST_QUAL_COMPLETED', 'label' => 'Post-Qualification'],
            ['event' => 'HOPE_APPROVED_RESOLUTION', 'label' => 'BAC Resolution Approved'],
            ['event' => 'NOA_ISSUED', 'label' => 'Notice of Award'],
            ['event' => 'NTP_ISSUED', 'label' => 'Notice to Proceed'],
            ['event' => 'CONTRACT_SIGNED', 'label' => 'Contract Signed'],
            ['event' => 'PAYMENT_RECORDED', 'label' => 'Payment Recorded'],
        ];

        $simplifiedProcess = [
            ['event' => 'APP_APPROVED', 'label' => 'APP Approved'],
            ['event' => 'PR_ACCEPTED', 'label' => 'Purchase Request Accepted'],
            ['event' => 'BUDGET_CERTIFIED', 'label' => 'Budget Certified'],
            ['event' => 'RFQ_SENT', 'label' => 'Request for Quotation Sent'],
            ['event' => 'BID_OPENING_COMPLETED', 'label' => 'Bid Opening'],
            ['event' => 'EVALUATION_COMPLETED', 'label' => 'Bid Evaluation'],
            ['event' => 'POST_QUAL_COMPLETED', 'label' => 'Post-Qualification'],
            ['event' => 'HOPE_APPROVED_RESOLUTION', 'label' => 'BAC Resolution Approved'],
            ['event' => 'NOA_ISSUED', 'label' => 'Notice of Award'],
            ['event' => 'NTP_ISSUED', 'label' => 'Notice to Proceed'],
            ['event' => 'CONTRACT_SIGNED', 'label' => 'Contract Signed'],
            ['event' => 'PAYMENT_RECORDED', 'label' => 'Payment Recorded'],
        ];

        return match ($mode) {
            'competitive_bidding', 'limited_source_bidding' => $competitiveBidding,
            'small_value_procurement', 'shopping', 'shopping_52_1a', 'shopping_52_1b' => $simplifiedProcess,
            'direct_contracting', 'negotiated_procurement', 'repeat_order' => $simplifiedProcess,
            default => $competitiveBidding,
        };
    }

    /**
     * List available documents for a posted+ procurement.
     */
    public function documents(string $reference)
    {
        $invitation = Invitation::with(['purchaseRequisition'])
            ->where('reference_number', $reference)
            ->whereNotIn('status', ['draft'])
            ->firstOrFail();

        // Pre-posting and returned items get no documents
        $preparationStatuses = ['pending_chairperson_approval', 'pending_hope_approval', 'approved', 'returned'];
        if (in_array($invitation->status, $preparationStatuses)) {
            return response()->json(['data' => [], 'message' => 'Documents are not yet available for this procurement.']);
        }

        $documents = [];

        // ITB/RFQ document (from DocumentVersion where entity = invitation)
        $itbDoc = DocumentVersion::where('entity_type', 'invitation')
            ->where('entity_id', $invitation->id)
            ->where('is_current', true)
            ->first();
        if ($itbDoc && $itbDoc->file_path) {
            $documents[] = [
                'id' => $itbDoc->id,
                'type' => 'itb_rfq',
                'label' => 'Invitation to Bid / RFQ Document',
                'available' => true,
            ];
        }

        // Abstract of Bids
        $evalSummary = EvaluationSummary::where('invitation_id', $invitation->id)->first();
        if ($evalSummary && $evalSummary->abstract_as_calculated_path) {
            $documents[] = [
                'id' => 'eval_' . $evalSummary->id,
                'type' => 'abstract_of_bids',
                'label' => 'Abstract of Bids',
                'available' => true,
            ];
        }

        // NOA, NTP, Contract documents from Award/Contract
        $award = Award::where('invitation_id', $invitation->id)->first();
        if ($award) {
            if ($award->noa_document_path) {
                $documents[] = [
                    'id' => 'noa_' . $award->id,
                    'type' => 'noa',
                    'label' => 'Notice of Award (NOA)',
                    'available' => true,
                ];
            }
            if ($award->ntp_document_path) {
                $documents[] = [
                    'id' => 'ntp_' . $award->id,
                    'type' => 'ntp',
                    'label' => 'Notice to Proceed (NTP)',
                    'available' => true,
                ];
            }

            $contract = Contract::where('award_id', $award->id)->first();
            if ($contract && $contract->contract_document_path) {
                $documents[] = [
                    'id' => 'contract_' . $contract->id,
                    'type' => 'contract',
                    'label' => 'Contract Document',
                    'available' => true,
                ];
            }
        }

        return response()->json(['data' => $documents]);
    }

    /**
     * Download a specific public document.
     */
    public function downloadDocument(string $id)
    {
        // Determine document type from ID prefix
        if (str_starts_with($id, 'eval_')) {
            $evalId = (int) str_replace('eval_', '', $id);
            $eval = EvaluationSummary::findOrFail($evalId);
            $invitation = Invitation::findOrFail($eval->invitation_id);
            if (in_array($invitation->status, ['draft', 'pending_chairperson_approval', 'pending_hope_approval', 'approved', 'returned'])) {
                abort(403, 'Document not publicly available.');
            }
            $path = $eval->abstract_as_calculated_path;
        } elseif (str_starts_with($id, 'noa_')) {
            $awardId = (int) str_replace('noa_', '', $id);
            $award = Award::findOrFail($awardId);
            $invitation = Invitation::findOrFail($award->invitation_id);
            if (in_array($invitation->status, ['draft', 'pending_chairperson_approval', 'pending_hope_approval', 'approved', 'returned'])) {
                abort(403, 'Document not publicly available.');
            }
            $path = $award->noa_document_path;
        } elseif (str_starts_with($id, 'ntp_')) {
            $awardId = (int) str_replace('ntp_', '', $id);
            $award = Award::findOrFail($awardId);
            $invitation = Invitation::findOrFail($award->invitation_id);
            if (in_array($invitation->status, ['draft', 'pending_chairperson_approval', 'pending_hope_approval', 'approved', 'returned'])) {
                abort(403, 'Document not publicly available.');
            }
            $path = $award->ntp_document_path;
        } elseif (str_starts_with($id, 'contract_')) {
            $contractId = (int) str_replace('contract_', '', $id);
            $contract = Contract::findOrFail($contractId);
            $award = Award::findOrFail($contract->award_id);
            $invitation = Invitation::findOrFail($award->invitation_id);
            if (in_array($invitation->status, ['draft', 'pending_chairperson_approval', 'pending_hope_approval', 'approved', 'returned'])) {
                abort(403, 'Document not publicly available.');
            }
            $path = $contract->contract_document_path;
        } else {
            // Numeric ID = DocumentVersion
            $docVersion = DocumentVersion::findOrFail((int) $id);
            if ($docVersion->entity_type === 'invitation') {
                $invitation = Invitation::findOrFail($docVersion->entity_id);
                if (in_array($invitation->status, ['draft', 'pending_chairperson_approval', 'pending_hope_approval', 'approved', 'returned'])) {
                    abort(403, 'Document not publicly available.');
                }
            }
            $path = $docVersion->file_path;
        }

        if (!$path || !Storage::disk('local')->exists($path)) {
            abort(404, 'Document file not found.');
        }

        return Storage::disk('local')->download($path);
    }
}

<?php

namespace App\Services;

use App\Models\Invitation;
use App\Models\PurchaseRequisition;
use App\Models\PreProcurementConference;
use App\Models\BlockchainEvent;
use Illuminate\Support\Facades\DB;
use App\Models\InvitationOverride;
use Carbon\Carbon;

class InvitationService
{
    protected $philgepsMock;
    protected $modeValidator;

    public function __construct(PhilgepsMockService $philgepsMock, AlternativeModeValidator $modeValidator)
    {
        $this->philgepsMock = $philgepsMock;
        $this->modeValidator = $modeValidator;
    }

    public function createFromPr(PurchaseRequisition $pr, array $data, $user): Invitation
    {
        return DB::transaction(function () use ($pr, $data, $user) {
            if (!in_array($pr->status, ['accepted', 'mode_confirmed'])) {
                throw new \Exception('Only accepted or mode-confirmed PRs can be used to create invitations.');
            }

            // Enforce pre-procurement conference requirement
            $hasApprovedConference = PreProcurementConference::where('purchase_requisition_id', $pr->id)
                ->where('status', 'approved')
                ->exists();

            if (!$hasApprovedConference) {
                throw new \Exception('An approved Pre-Procurement Conference is required before creating an invitation. Please schedule and complete the conference first.');
            }

            $existing = Invitation::where('purchase_requisition_id', $pr->id)
                ->whereNotIn('status', ['cancelled'])
                ->exists();

            if ($existing) {
                throw new \Exception('An active invitation already exists for this PR.');
            }

            $type = $this->resolveInvitationType($pr);
            $submissionDeadline = isset($data['submission_deadline']) ? Carbon::parse($data['submission_deadline']) : null;
            $openingDate = isset($data['opening_date'])
                ? Carbon::parse($data['opening_date'])
                : $submissionDeadline;

            if (!$submissionDeadline || !$openingDate) {
                throw new \Exception('Submission deadline and opening date are required.');
            }

            if ($openingDate->lt($submissionDeadline)) {
                throw new \Exception('Opening date must be the same as or after submission deadline.');
            }

            $projectTitle = $data['project_title'] ?? ($pr->appEntry?->project_title ?? $pr->pr_reference);
            $procurementMode = $pr->procurement_mode ?? $pr->appEntry?->mode;

            $invitation = Invitation::create([
                'reference_number' => Invitation::generateReference($type),
                'purchase_requisition_id' => $pr->id,
                'type' => $type,
                'project_title' => $projectTitle,
                'procuring_entity' => $data['procuring_entity'] ?? config('app.name'),
                'abc' => $pr->total_value,
                'fund_source' => $pr->fund_source ?? $pr->appEntry?->fund_source,
                'procurement_mode' => $procurementMode,
                'bid_document_cost' => $data['bid_document_cost'] ?? null,
                'eligibility_check_date' => $data['eligibility_check_date'] ?? null,
                'pre_bid_conference_date' => $data['pre_bid_conference_date'] ?? null,
                'submission_deadline' => $submissionDeadline,
                'opening_date' => $openingDate,
                'opening_venue' => $data['opening_venue'] ?? null,
                'contact_person' => $data['contact_person'] ?? null,
                'contact_email' => $data['contact_email'] ?? null,
                'contact_phone' => $data['contact_phone'] ?? null,
                'additional_requirements' => $data['additional_requirements'] ?? null,
                'special_conditions' => $data['special_conditions'] ?? null,
                'technical_specifications' => $data['technical_specifications'] ?? null,
                'delivery_location' => $data['delivery_location'] ?? null,
                'delivery_schedule' => $data['delivery_schedule'] ?? null,
                'payment_terms' => $data['payment_terms'] ?? null,
                
                // Alternative mode fields
                'alternative_mode_justification' => $data['alternative_mode_justification'] ?? null,
                'hope_approval_reference' => $data['hope_approval_reference'] ?? null,
                'selected_supplier_name' => $data['selected_supplier_name'] ?? null,
                'selected_supplier_details' => $data['selected_supplier_details'] ?? null,
                'mode_specific_data' => $data['mode_specific_data'] ?? null,

                'status' => Invitation::STATUS_DRAFT,
                'created_by' => $user->id,
            ]);

            // Log overrides if any
            if (isset($data['overrides']) && is_array($data['overrides'])) {
                foreach ($data['overrides'] as $over) {
                    InvitationOverride::create([
                        'invitation_id' => $invitation->id,
                        'override_stage' => $over['override_stage'] ?? 'invitation_drafting',
                        'field_name' => $over['field'] ?? ($over['field_name'] ?? null),
                        'original_value' => $over['original'] ?? ($over['original_value'] ?? null),
                        'new_value' => $over['new'] ?? ($over['new_value'] ?? null),
                        'changed_by' => $user->id,
                        'reason' => $over['reason'],
                        'changed_at' => now(),
                    ]);
                }
            }

            return $invitation->fresh();
        });
    }

    public function submitForApproval(Invitation $invitation, $user)
    {
        if ($invitation->status !== Invitation::STATUS_DRAFT) {
            throw new \Exception('Only draft invitations can be submitted for approval.');
        }

        $isAlternative = in_array($invitation->procurement_mode, [
            Invitation::MODE_DIRECT_CONTRACTING,
            Invitation::MODE_DIRECT_ACQUISITION,
            Invitation::MODE_NEGOTIATED,
            Invitation::MODE_REPEAT_ORDER,
            Invitation::MODE_DIRECT_SALES,
            Invitation::MODE_STI,
        ]);

        if ($isAlternative) {
            if (strlen($invitation->alternative_mode_justification) < 100) {
                throw new \Exception("Alternative mode justification must be at least 100 characters.");
            }
            // Run mode-specific validation (RA 9184 rules)
            $this->modeValidator->validate($invitation);
            $invitation->update(['status' => Invitation::STATUS_PENDING_HOPE]);
        } else {
            $invitation->update(['status' => Invitation::STATUS_PENDING_CHAIR]);
        }

        return $invitation;
    }

    public function approve(Invitation $invitation, $user)
    {
        if ($invitation->status === Invitation::STATUS_PENDING_CHAIR) {
            if (!$user->hasRole('bac_chairperson')) {
                throw new \Exception('Only the BAC Chairperson can approve this invitation.');
            }
            $invitation->update([
                'status' => Invitation::STATUS_APPROVED,
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);
        } elseif ($invitation->status === Invitation::STATUS_PENDING_HOPE) {
            if (!$user->hasRole('hope')) {
                throw new \Exception('Only the HOPE can approve this alternative mode justification.');
            }
            $invitation->update([
                'status' => Invitation::STATUS_APPROVED,
                'hope_approved_by' => $user->id,
                'hope_approved_at' => now(),
            ]);
        } else {
            throw new \Exception('Invitation is not pending approval.');
        }

        return $invitation;
    }

    public function post(Invitation $invitation, $user)
    {
        if ($invitation->status !== Invitation::STATUS_APPROVED) {
            throw new \Exception("Invitation must be approved before posting.");
        }

        $isAlternative = in_array($invitation->procurement_mode, [
            Invitation::MODE_DIRECT_CONTRACTING,
            Invitation::MODE_DIRECT_ACQUISITION,
            Invitation::MODE_NEGOTIATED,
            Invitation::MODE_REPEAT_ORDER,
            Invitation::MODE_DIRECT_SALES,
            Invitation::MODE_STI,
        ]);

        if ($isAlternative) {
            $invitation->update([
                'status' => Invitation::STATUS_RECORDED,
                'posted_at' => now()
            ]);
            $event = 'ALTERNATIVE_MODE_RECORDED';
        } else {
            if ($invitation->type === 'itb') {
                $philgepsData = $this->philgepsMock->postNotice([
                    'title' => $invitation->project_title,
                    'abc' => $invitation->abc,
                    'deadline' => $invitation->submission_deadline
                ]);
                $invitation->update([
                    'status' => Invitation::STATUS_POSTED,
                    'philgeps_reference' => $philgepsData['philgeps_reference'],
                    'posted_at' => now()
                ]);
                $event = 'ITB_POSTED';
            } else {
                $invitation->update([
                    'status' => Invitation::STATUS_SENT,
                    'posted_at' => now()
                ]);
                $event = 'RFQ_SENT';
            }
        }

        $docHash = hash('sha256', json_encode($invitation->fresh()->toArray()));
        BlockchainEvent::recordEvent($event, $user->id, Invitation::class, $invitation->id, $docHash, [
            'procurement_id' => (string) $invitation->purchase_requisition_id,
            'reference_number' => $invitation->reference_number,
            'mode' => $invitation->procurement_mode,
        ]);

        return $invitation;
    }

    public function sendRfq(Invitation $rfq, array $vendorIds, $user)
    {
        if ($rfq->type !== 'rfq') {
            throw new \Exception("This invitation is not an RFQ.");
        }

        if (!in_array($rfq->status, [Invitation::STATUS_DRAFT, Invitation::STATUS_APPROVED], true)) {
            throw new \Exception('Only draft or approved RFQs can be sent.');
        }
        
        if (count($vendorIds) < 3) {
            throw new \Exception("Small Value Procurement requires inviting at least 3 vendors.");
        }

        return DB::transaction(function () use ($rfq, $vendorIds, $user) {
            foreach ($vendorIds as $vendorId) {
                $rfq->rfqInvitations()->updateOrCreate(
                    ['vendor_id' => (int) $vendorId],
                    ['status' => 'sent', 'sent_at' => now()]
                );
            }

            $rfq->update(['status' => Invitation::STATUS_POSTED, 'posted_at' => now()]);
            $docHash = hash('sha256', json_encode(array_merge($rfq->fresh()->toArray(), ['vendors' => $vendorIds])));

            BlockchainEvent::recordEvent('RFQ_SENT', $user->id, Invitation::class, $rfq->id, $docHash, [
                'procurement_id' => (string) $rfq->purchase_requisition_id,
                'reference_number' => $rfq->reference_number,
                'vendor_count' => count($vendorIds),
            ]);

            return $rfq;
        });
    }

    public function returnInvitation(Invitation $invitation, $user, string $remarks)
    {
        if (!in_array($invitation->status, [
            Invitation::STATUS_PENDING_CHAIR,
            Invitation::STATUS_PENDING_HOPE,
        ])) {
            throw new \Exception('Only pending invitations can be returned.');
        }

        $invitation->update([
            'status' => Invitation::STATUS_DRAFT,
            'return_remarks' => $remarks,
            'returned_by' => $user->id,
            'returned_at' => now(),
        ]);

        return $invitation;
    }

    private function resolveInvitationType(PurchaseRequisition $pr): string
    {
        $mode = (string) ($pr->procurement_mode ?? $pr->appEntry?->mode ?? '');

        return match ($mode) {
            Invitation::MODE_COMPETITIVE_BIDDING => 'itb',
            Invitation::MODE_SVP, Invitation::MODE_SHOPPING_A, Invitation::MODE_SHOPPING_B => 'rfq',
            Invitation::MODE_LIMITED_SOURCE => 'limited_source',
            default => 'direct',
        };
    }
}

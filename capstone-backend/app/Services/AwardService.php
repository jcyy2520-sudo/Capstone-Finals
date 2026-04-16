<?php

namespace App\Services;

use App\Models\Award;
use App\Models\BacResolution;
use App\Models\BidOpening;
use App\Models\BidPrice;
use App\Models\BlockchainEvent;
use App\Models\PostQualification;
use Illuminate\Support\Facades\DB;

class AwardService
{
    /**
     * HOPE approves BAC Resolution and creates a DRAFT NOA.
     */
    public function approveResolution(BacResolution $resolution, int $userId, float $perfSecurityPct): Award
    {
        if ($resolution->status !== 'signed') {
            throw new \InvalidArgumentException('Resolution is not formally signed by BAC yet.');
        }

        return DB::transaction(function () use ($resolution, $userId, $perfSecurityPct) {
            $resolution->update([
                'hope_approved_by' => $userId,
                'hope_approved_at' => now(),
                'status' => 'approved_by_hope',
            ]);

            $postQual = PostQualification::where('invitation_id', $resolution->invitation_id)
                ->where('result', 'passed')
                ->firstOrFail();

            $bidPrice = BidPrice::where('bid_opening_id', $postQual->bid_opening_id)
                ->where('vendor_id', $postQual->vendor_id)
                ->firstOrFail();

            $contractAmount = $bidPrice->amount_as_calculated;
            $performanceSecurityAmount = $contractAmount * ($perfSecurityPct / 100);

            $award = Award::create([
                'noa_reference' => Award::generateNoaReference(),
                'invitation_id' => $resolution->invitation_id,
                'bid_opening_id' => $postQual->bid_opening_id,
                'vendor_id' => $postQual->vendor_id,
                'contract_amount' => $contractAmount,
                'performance_security_amount' => $performanceSecurityAmount,
                'status' => Award::STATUS_DRAFT,
            ]);

            $bidOpening = BidOpening::find($postQual->bid_opening_id);
            $bidOpening?->update(['status' => 'AWARD_RECOMMENDED']);

            BlockchainEvent::recordEvent(
                'HOPE_APPROVED_RESOLUTION',
                $userId,
                BacResolution::class,
                $resolution->id,
                $resolution->document_hash,
                ['resolution_id' => $resolution->id, 'perf_security_pct' => $perfSecurityPct]
            );

            return $award;
        });
    }

    /**
     * HOPE signs and issues NOA to winning bidder.
     */
    public function issueNoa(Award $award, int $userId): Award
    {
        if ($award->status !== Award::STATUS_DRAFT) {
            throw new \InvalidArgumentException('NOA is not in a draft state.');
        }

        return DB::transaction(function () use ($award, $userId) {
            $noaHash = hash('sha256', "NOA_DOC_{$award->id}_" . now()->timestamp);

            $award->update([
                'status' => Award::STATUS_ISSUED,
                'hope_signed_by' => $userId,
                'hope_signed_at' => now(),
                'noa_issued_at' => now(),
                'noa_acknowledgment_deadline' => now()->addDays(3)->toDateString(),
                'noa_document_path' => "simulated_path/noa_{$award->id}.pdf",
                'noa_document_hash' => $noaHash,
            ]);

            $award->bidOpening()->update(['status' => 'NOA_ISSUED']);

            BlockchainEvent::recordEvent(
                'NOA_ISSUED',
                $userId,
                Award::class,
                $award->id,
                $noaHash,
                ['award_id' => $award->id, 'vendor_id' => $award->vendor_id, 'contract_amount' => $award->contract_amount]
            );

            return $award->fresh();
        });
    }

    /**
     * Vendor acknowledges NOA. Starts 10-day performance security deadline.
     */
    public function vendorAcknowledge(Award $award, int $userId): Award
    {
        if ($award->status !== Award::STATUS_ISSUED) {
            throw new \InvalidArgumentException('NOA must be ISSUED before it can be acknowledged.');
        }

        return DB::transaction(function () use ($award, $userId) {
            $psecDeadline = now()->addDays(10)->toDateString();

            $award->update([
                'status' => Award::STATUS_ACKNOWLEDGED,
                'noa_acknowledged_at' => now(),
                'performance_security_deadline' => $psecDeadline,
            ]);

            $award->bidOpening()->update(['status' => 'NOA_ACKNOWLEDGED']);

            BlockchainEvent::recordEvent(
                'NOA_ACKNOWLEDGED',
                $userId,
                Award::class,
                $award->id,
                $award->noa_document_hash,
                ['is_simulated' => true]
            );

            return $award->fresh();
        });
    }

    /**
     * Cancel an award with formal justification.
     */
    public function cancelAward(Award $award, int $userId, string $grounds): Award
    {
        return DB::transaction(function () use ($award, $userId, $grounds) {
            $award->update([
                'status' => Award::STATUS_CANCELLED,
                'cancellation_grounds' => $grounds,
            ]);

            $award->bidOpening()->update(['status' => 'AWARD_CANCELLED']);

            BlockchainEvent::recordEvent(
                'AWARD_CANCELLED',
                $userId,
                Award::class,
                $award->id,
                null,
                ['grounds' => $grounds]
            );

            return $award->fresh();
        });
    }
}

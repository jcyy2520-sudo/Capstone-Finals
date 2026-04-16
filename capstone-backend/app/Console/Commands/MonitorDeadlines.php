<?php

namespace App\Console\Commands;

use App\Models\Award;
use App\Models\Contract;
use App\Models\Invitation;
use App\Models\PostQualification;
use App\Models\User;
use App\Models\VendorDocument;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class MonitorDeadlines extends Command
{
    protected $signature = 'procureseal:monitor-deadlines';
    protected $description = 'Check procurement deadlines and send notifications at 75%, 90%, and 100% thresholds';

    private NotificationService $notificationService;
    private array $thresholds = [75, 90, 100];

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle(): int
    {
        $this->info('Checking procurement deadlines...');

        $counts = [
            'bid_submission' => $this->checkBidSubmissionDeadlines(),
            'post_qual' => $this->checkPostQualDeadlines(),
            'noa_acknowledgment' => $this->checkNoaAcknowledgmentDeadlines(),
            'performance_security' => $this->checkPerformanceSecurityDeadlines(),
            'contract_signing' => $this->checkContractSigningDeadlines(),
            'contract_completion' => $this->checkContractCompletionDeadlines(),
            'vendor_documents' => $this->checkVendorDocumentExpiry(),
        ];

        $total = array_sum($counts);
        $this->info("Deadline check complete. {$total} warning(s) sent.");
        foreach ($counts as $type => $count) {
            if ($count > 0) {
                $this->line("  - {$type}: {$count}");
            }
        }

        return Command::SUCCESS;
    }

    /**
     * Check bid submission deadlines (invitation → vendors).
     */
    private function checkBidSubmissionDeadlines(): int
    {
        $count = 0;
        $invitations = Invitation::where('status', 'posted')
            ->whereNotNull('submission_deadline')
            ->where('submission_deadline', '>', now()->subDays(1))
            ->get();

        foreach ($invitations as $invitation) {
            $percent = $this->computePercentElapsed($invitation->created_at, $invitation->submission_deadline);
            if ($this->shouldAlert($percent, 'invitation', $invitation->id)) {
                // Notify BAC secretariat users
                $secretariatIds = $this->getUserIdsByRole('bac_secretariat');
                foreach ($secretariatIds as $userId) {
                    $this->notificationService->sendDeadlineWarning(
                        $userId,
                        "ITB: {$invitation->itb_reference}",
                        'Bid Submission Deadline',
                        $invitation->submission_deadline->format('M d, Y h:i A'),
                        $percent,
                        '/bac-secretariat/invitations',
                        'Invitation',
                        $invitation->id,
                    );
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Check post-qualification submission deadlines (vendor uploads).
     */
    private function checkPostQualDeadlines(): int
    {
        $count = 0;
        $postQuals = PostQualification::where('status', 'pending')
            ->whereNotNull('submission_deadline_at')
            ->where('submission_deadline_at', '>', now()->subDays(1))
            ->get();

        foreach ($postQuals as $pq) {
            $percent = $this->computePercentElapsed($pq->created_at, $pq->submission_deadline_at);
            if ($this->shouldAlert($percent, 'postqual', $pq->id)) {
                // Notify the vendor
                $vendor = $pq->vendor;
                if ($vendor?->user_id) {
                    $this->notificationService->sendDeadlineWarning(
                        $vendor->user_id,
                        "Post-Qualification for Vendor #{$vendor->id}",
                        'Document Submission Deadline',
                        Carbon::parse($pq->submission_deadline_at)->format('M d, Y h:i A'),
                        $percent,
                        '/vendor/post-qualification',
                        'PostQualification',
                        $pq->id,
                    );
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Check NOA acknowledgment deadlines (3 calendar days).
     */
    private function checkNoaAcknowledgmentDeadlines(): int
    {
        $count = 0;
        $awards = Award::where('status', 'noa_issued')
            ->whereNotNull('noa_acknowledgment_deadline')
            ->whereNull('noa_acknowledged_at')
            ->where('noa_acknowledgment_deadline', '>', now()->subDays(1))
            ->get();

        foreach ($awards as $award) {
            $percent = $this->computePercentElapsed($award->noa_issued_at, $award->noa_acknowledgment_deadline);
            if ($this->shouldAlert($percent, 'noa_ack', $award->id)) {
                // Notify vendor
                $vendor = $award->vendor;
                if ($vendor?->user_id) {
                    $this->notificationService->sendDeadlineWarning(
                        $vendor->user_id,
                        "NOA: {$award->noa_reference}",
                        'NOA Acknowledgment Deadline',
                        $award->noa_acknowledgment_deadline->format('M d, Y'),
                        $percent,
                        '/vendor/awards',
                        'Award',
                        $award->id,
                    );
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Check performance security posting deadlines.
     */
    private function checkPerformanceSecurityDeadlines(): int
    {
        $count = 0;
        $awards = Award::whereIn('status', ['noa_issued', 'noa_acknowledged'])
            ->whereNotNull('performance_security_deadline')
            ->where('performance_security_deadline', '>', now()->subDays(1))
            ->get();

        foreach ($awards as $award) {
            $start = $award->noa_acknowledged_at ?? $award->noa_issued_at ?? $award->created_at;
            $percent = $this->computePercentElapsed($start, $award->performance_security_deadline);
            if ($this->shouldAlert($percent, 'perf_security', $award->id)) {
                $vendor = $award->vendor;
                if ($vendor?->user_id) {
                    $this->notificationService->sendDeadlineWarning(
                        $vendor->user_id,
                        "Award: {$award->noa_reference}",
                        'Performance Security Deadline',
                        $award->performance_security_deadline->format('M d, Y'),
                        $percent,
                        '/vendor/awards',
                        'Award',
                        $award->id,
                    );
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Check contract signing deadlines.
     */
    private function checkContractSigningDeadlines(): int
    {
        $count = 0;
        $awards = Award::whereIn('status', ['noa_issued', 'noa_acknowledged'])
            ->whereNotNull('contract_signing_deadline')
            ->where('contract_signing_deadline', '>', now()->subDays(1))
            ->get();

        foreach ($awards as $award) {
            $start = $award->noa_issued_at ?? $award->created_at;
            $percent = $this->computePercentElapsed($start, $award->contract_signing_deadline);
            if ($this->shouldAlert($percent, 'contract_sign', $award->id)) {
                // Notify BAC secretariat
                $secretariatIds = $this->getUserIdsByRole('bac_secretariat');
                foreach ($secretariatIds as $userId) {
                    $this->notificationService->sendDeadlineWarning(
                        $userId,
                        "Contract Signing for {$award->noa_reference}",
                        'Contract Signing Deadline',
                        $award->contract_signing_deadline->format('M d, Y'),
                        $percent,
                        '/bac-secretariat/awards',
                        'Award',
                        $award->id,
                    );
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Check contract completion (end_date) deadlines.
     */
    private function checkContractCompletionDeadlines(): int
    {
        $count = 0;
        $contracts = Contract::where('status', 'active')
            ->whereNotNull('end_date')
            ->where('end_date', '>', now()->subDays(7))
            ->get();

        foreach ($contracts as $contract) {
            $start = $contract->ntp_date ?? $contract->created_at;
            $percent = $this->computePercentElapsed($start, $contract->end_date);
            if ($this->shouldAlert($percent, 'contract_end', $contract->id)) {
                // Notify BAC secretariat + HOPE
                $recipientIds = array_merge(
                    $this->getUserIdsByRole('bac_secretariat'),
                    $this->getUserIdsByRole('hope'),
                );
                foreach ($recipientIds as $userId) {
                    $this->notificationService->sendDeadlineWarning(
                        $userId,
                        "Contract: {$contract->contract_reference}",
                        'Contract Completion Deadline',
                        Carbon::parse($contract->end_date)->format('M d, Y'),
                        $percent,
                        '/bac-secretariat/contracts',
                        'Contract',
                        $contract->id,
                    );
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Check vendor document expiry dates.
     */
    private function checkVendorDocumentExpiry(): int
    {
        $count = 0;
        // Check documents expiring within 30 days or already expired within 7 days
        $documents = VendorDocument::whereNotNull('expiry_date')
            ->where('expiry_date', '>', now()->subDays(7))
            ->where('expiry_date', '<', now()->addDays(30))
            ->where('status', '!=', 'expired')
            ->with('vendor')
            ->get();

        foreach ($documents as $doc) {
            $daysUntilExpiry = now()->diffInDays($doc->expiry_date, false);
            $percent = $daysUntilExpiry <= 0 ? 100 : ($daysUntilExpiry <= 7 ? 90 : 75);

            if ($this->shouldAlert($percent, 'vendor_doc', $doc->id)) {
                $vendor = $doc->vendor;
                if ($vendor?->user_id) {
                    $label = $daysUntilExpiry <= 0
                        ? "EXPIRED: {$doc->doc_type}"
                        : "{$doc->doc_type} expires in {$daysUntilExpiry} days";

                    $this->notificationService->sendDeadlineWarning(
                        $vendor->user_id,
                        $label,
                        'Document Expiry',
                        Carbon::parse($doc->expiry_date)->format('M d, Y'),
                        $percent,
                        '/vendor/profile',
                        'VendorDocument',
                        $doc->id,
                    );
                    $count++;
                }

                // Mark as expired if past
                if ($daysUntilExpiry <= 0) {
                    $doc->update(['status' => 'expired']);
                }
            }
        }

        return $count;
    }

    /**
     * Compute % of time elapsed between start and deadline.
     */
    private function computePercentElapsed(Carbon|string $start, Carbon|string $deadline): int
    {
        $start = Carbon::parse($start);
        $deadline = Carbon::parse($deadline);
        $totalDuration = $start->diffInMinutes($deadline);

        if ($totalDuration <= 0) return 100;

        $elapsed = $start->diffInMinutes(now());
        return min(100, (int) round(($elapsed / $totalDuration) * 100));
    }

    /**
     * Prevent duplicate alerts — only alert at threshold crossings.
     * Uses a simple cache key to avoid spamming same threshold.
     */
    private function shouldAlert(int $percent, string $type, int $entityId): bool
    {
        foreach ($this->thresholds as $threshold) {
            if ($percent >= $threshold) {
                $cacheKey = "deadline_alert:{$type}:{$entityId}:{$threshold}";
                if (!cache()->has($cacheKey)) {
                    // Mark this threshold as alerted (expires in 24 hours)
                    cache()->put($cacheKey, true, now()->addHours(24));
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Get user IDs by role slug.
     */
    private function getUserIdsByRole(string $roleSlug): array
    {
        return User::whereHas('role', fn($q) => $q->where('slug', $roleSlug))
            ->pluck('id')
            ->toArray();
    }
}

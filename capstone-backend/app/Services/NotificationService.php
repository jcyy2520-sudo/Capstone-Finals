<?php

namespace App\Services;

use App\Mail\DeadlineWarningMail;
use App\Mail\ProcurementNotificationMail;
use App\Models\ProcurementNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    /**
     * Create an in-app notification and optionally send email.
     */
    public function notify(
        int $recipientId,
        string $type,
        string $title,
        string $message,
        string $priority = 'normal',
        ?string $entityType = null,
        ?int $entityId = null,
        ?string $actionUrl = null,
        bool $sendEmail = false,
    ): ProcurementNotification {
        $notification = ProcurementNotification::create([
            'recipient_id' => $recipientId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'priority' => $priority,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action_url' => $actionUrl,
        ]);

        if ($sendEmail && in_array($priority, ['high', 'critical'])) {
            $this->sendEmail($notification);
        }

        return $notification;
    }

    /**
     * Notify multiple recipients.
     */
    public function notifyMany(
        array $recipientIds,
        string $type,
        string $title,
        string $message,
        string $priority = 'normal',
        ?string $entityType = null,
        ?int $entityId = null,
        ?string $actionUrl = null,
        bool $sendEmail = false,
    ): void {
        foreach ($recipientIds as $recipientId) {
            $this->notify(
                $recipientId, $type, $title, $message,
                $priority, $entityType, $entityId, $actionUrl, $sendEmail
            );
        }
    }

    /**
     * Send deadline warning notification.
     */
    public function sendDeadlineWarning(
        int $recipientId,
        string $entityLabel,
        string $deadlineLabel,
        string $deadlineDate,
        int $percentElapsed,
        string $actionUrl,
        ?string $entityType = null,
        ?int $entityId = null,
    ): ProcurementNotification {
        $priority = $percentElapsed >= 100 ? 'critical' : ($percentElapsed >= 90 ? 'high' : 'normal');
        $statusText = $percentElapsed >= 100 ? 'OVERDUE' : "{$percentElapsed}% elapsed";

        $notification = $this->notify(
            $recipientId,
            'deadline_warning',
            "Deadline: {$entityLabel} — {$deadlineLabel}",
            "{$statusText}. Deadline: {$deadlineDate}. Please take action.",
            $priority,
            $entityType,
            $entityId,
            $actionUrl,
        );

        // Send deadline email for high/critical
        if (in_array($priority, ['high', 'critical'])) {
            $this->sendDeadlineEmail($notification, $entityLabel, $deadlineLabel, $deadlineDate, $percentElapsed, $actionUrl);
        }

        return $notification;
    }

    /**
     * Send procurement notification email.
     */
    private function sendEmail(ProcurementNotification $notification): void
    {
        try {
            $recipient = $notification->recipient;
            if ($recipient?->email) {
                Mail::to($recipient->email)->send(new ProcurementNotificationMail($notification));
                $notification->update(['email_sent_at' => now()]);
            }
        } catch (\Throwable $e) {
            Log::error("Failed to send notification email #{$notification->id}: {$e->getMessage()}");
        }
    }

    /**
     * Send deadline warning email.
     */
    private function sendDeadlineEmail(
        ProcurementNotification $notification,
        string $entityLabel,
        string $deadlineLabel,
        string $deadlineDate,
        int $percentElapsed,
        string $actionUrl,
    ): void {
        try {
            $recipient = $notification->recipient;
            if ($recipient?->email) {
                Mail::to($recipient->email)->send(
                    new DeadlineWarningMail($entityLabel, $deadlineLabel, $deadlineDate, $percentElapsed, $actionUrl)
                );
                $notification->update(['email_sent_at' => now()]);
            }
        } catch (\Throwable $e) {
            Log::error("Failed to send deadline email #{$notification->id}: {$e->getMessage()}");
        }
    }
}

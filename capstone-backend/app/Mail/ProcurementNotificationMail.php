<?php

namespace App\Mail;

use App\Models\ProcurementNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProcurementNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ProcurementNotification $notification
    ) {}

    public function envelope(): Envelope
    {
        $prefix = match ($this->notification->priority) {
            'critical' => '[URGENT] ',
            'high' => '[Action Required] ',
            default => '',
        };

        return new Envelope(
            subject: $prefix . $this->notification->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.procurement-notification',
        );
    }
}

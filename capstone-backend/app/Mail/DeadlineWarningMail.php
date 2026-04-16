<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DeadlineWarningMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $entityLabel,
        public string $deadlineLabel,
        public string $deadlineDate,
        public int $percentElapsed,
        public string $actionUrl,
    ) {}

    public function envelope(): Envelope
    {
        $urgency = $this->percentElapsed >= 100 ? '[OVERDUE] ' : '[Deadline Warning] ';

        return new Envelope(
            subject: $urgency . "{$this->entityLabel} — {$this->deadlineLabel}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.deadline-warning',
        );
    }
}

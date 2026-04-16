<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;

class Award extends Model
{
    use HasFactory;

    // ─── Status Constants (must match DB enum after migration 142334) ───
    const STATUS_DRAFT = 'DRAFT';
    const STATUS_ISSUED = 'ISSUED';
    const STATUS_ACKNOWLEDGED = 'ACKNOWLEDGED';
    const STATUS_NTP_ISSUED = 'NTP_ISSUED';
    const STATUS_CANCELLED = 'CANCELLED';
    const STATUS_RE_AWARD = 'RE_AWARD';

    protected $fillable = [
        'noa_reference', 'invitation_id', 'bid_opening_id', 'vendor_id',
        'contract_amount', 'performance_security_amount', 'performance_security_deadline',
        'contract_signing_deadline', 'special_conditions',
        'noa_document_path', 'noa_document_hash',
        'ntp_reference', 'ntp_document_path', 'ntp_document_hash', 'ntp_date',
        'status', 'hope_signed_by', 'hope_signed_at',
        'noa_issued_at', 'noa_acknowledgment_deadline', 'noa_acknowledged_at', 'ntp_issued_at',
        'cancellation_grounds',
    ];

    protected function casts(): array
    {
        return [
            'contract_amount' => 'decimal:2',
            'performance_security_amount' => 'decimal:2',
            'performance_security_deadline' => 'date',
            'contract_signing_deadline' => 'date',
            'ntp_date' => 'date',
            'noa_acknowledgment_deadline' => 'date',
            'hope_signed_at' => 'datetime',
            'noa_issued_at' => 'datetime',
            'noa_acknowledged_at' => 'datetime',
            'ntp_issued_at' => 'datetime',
        ];
    }

    public function invitation(): BelongsTo { return $this->belongsTo(Invitation::class); }
    public function bidOpening(): BelongsTo { return $this->belongsTo(BidOpening::class); }
    public function vendor(): BelongsTo { return $this->belongsTo(Vendor::class); }
    public function hopeSigner(): BelongsTo { return $this->belongsTo(User::class, 'hope_signed_by'); }
    public function contract(): HasOne { return $this->hasOne(Contract::class); }

    public static function generateNoaReference(): string
    {
        $year = now()->year;
        $seq = static::whereYear('created_at', $year)->count() + 1;
        return sprintf('NOA-%d-%04d', $year, $seq);
    }
}

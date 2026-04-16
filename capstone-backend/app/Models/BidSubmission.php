<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class BidSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'vendor_id',
        'bid_amount',
        'remarks',
        'documents',
        'status',
        'submitted_at',
        'is_late',
        'document_hash',
    ];

    protected function casts(): array
    {
        return [
            'bid_amount' => 'decimal:2',
            'documents' => 'array',
            'submitted_at' => 'datetime',
            'is_late' => 'boolean',
        ];
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }
}

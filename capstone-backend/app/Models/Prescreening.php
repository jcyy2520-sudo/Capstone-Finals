<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Prescreening extends Model
{
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'vendor_id',
        'document_results',
        'overall_status',
        'internal_notes',
        'prescreened_by',
        'prescreened_at',
    ];

    protected function casts(): array
    {
        return [
            'document_results' => 'array',
            'prescreened_at' => 'datetime',
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

    public function prescreenedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prescreened_by');
    }
}

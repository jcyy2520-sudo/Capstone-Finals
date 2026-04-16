<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class VendorPhysicalVerification extends Model
{
    protected $fillable = [
        'vendor_id',
        'verified_by',
        'checklist_results',
        'session_ip',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'checklist_results' => 'array',
            'verified_at' => 'datetime',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class VendorDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id',
        'doc_type',
        'file_name',
        'file_path',
        'file_hash',
        'file_size',
        'mime_type',
        'expiry_date',
        'status',
        'remarks',
        'verified_by',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'expiry_date' => 'date',
            'verified_at' => 'datetime',
        ];
    }

    // ─── Relationships ──────────────────────────────────

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // ─── Helpers ────────────────────────────────────────

    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    /**
     * Verify document integrity by comparing current file hash with stored hash.
     */
    public function verifyHash(string $currentHash): bool
    {
        return hash_equals($this->file_hash, $currentHash);
    }
}

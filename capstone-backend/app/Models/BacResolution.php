<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class BacResolution extends Model
{
    use HasFactory;

    protected $fillable = [
        'resolution_reference', 'invitation_id', 'type', 'subject', 'body',
        'document_path', 'document_hash', 'signatories',
        'min_signatures_required', 'status', 'created_by',
        'hope_approved_by', 'hope_approved_at',
    ];

    protected function casts(): array
    {
        return [
            'signatories' => 'array',
            'hope_approved_at' => 'datetime',
        ];
    }

    public function invitation(): BelongsTo { return $this->belongsTo(Invitation::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function hopeApprover(): BelongsTo { return $this->belongsTo(User::class, 'hope_approved_by'); }

    public function hasRequiredSignatures(): bool
    {
        $signatories = $this->signatories ?? [];
        return count($signatories) >= $this->min_signatures_required;
    }
}

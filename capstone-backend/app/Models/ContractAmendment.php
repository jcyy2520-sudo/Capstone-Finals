<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class ContractAmendment extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id', 'type', 'description', 'justification',
        'original_value', 'amended_value', 'status',
        'requested_by', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'original_value' => 'decimal:2',
            'amended_value' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    public function contract(): BelongsTo { return $this->belongsTo(Contract::class); }
    public function requester(): BelongsTo { return $this->belongsTo(User::class, 'requested_by'); }
    public function approver(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
}

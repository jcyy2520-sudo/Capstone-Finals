<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class ContractExtension extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id', 'additional_days', 'new_end_date',
        'justification', 'grounds', 'status',
        'requested_by', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'new_end_date' => 'date',
            'approved_at' => 'datetime',
        ];
    }

    public function contract(): BelongsTo { return $this->belongsTo(Contract::class); }
    public function requester(): BelongsTo { return $this->belongsTo(User::class, 'requested_by'); }
    public function approver(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
}

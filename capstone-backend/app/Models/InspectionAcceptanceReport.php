<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class InspectionAcceptanceReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id', 'inspection_items', 'inspected_by',
        'accepted_by', 'status', 'inspection_remarks',
        'inspected_at', 'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'inspection_items' => 'array',
            'inspected_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    public function contract(): BelongsTo { return $this->belongsTo(Contract::class); }
    public function inspector(): BelongsTo { return $this->belongsTo(User::class, 'inspected_by'); }
    public function acceptor(): BelongsTo { return $this->belongsTo(User::class, 'accepted_by'); }
}

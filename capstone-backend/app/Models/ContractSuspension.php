<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class ContractSuspension extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id', 'reason', 'suspension_date',
        'resumption_date', 'suspension_days', 'issued_by',
    ];

    protected function casts(): array
    {
        return [
            'suspension_date' => 'date',
            'resumption_date' => 'date',
        ];
    }

    public function contract(): BelongsTo { return $this->belongsTo(Contract::class); }
    public function issuer(): BelongsTo { return $this->belongsTo(User::class, 'issued_by'); }
}

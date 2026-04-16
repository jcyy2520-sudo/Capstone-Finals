<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id', 'iar_id', 'vendor_id', 'invoice_number',
        'amount', 'document_path', 'status',
        'validated_by', 'validated_at', 'paid_at', 'remarks',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'validated_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function contract(): BelongsTo { return $this->belongsTo(Contract::class); }
    public function inspectionReport(): BelongsTo { return $this->belongsTo(InspectionAcceptanceReport::class, 'iar_id'); }
    public function vendor(): BelongsTo { return $this->belongsTo(Vendor::class); }
    public function validator(): BelongsTo { return $this->belongsTo(User::class, 'validated_by'); }
}

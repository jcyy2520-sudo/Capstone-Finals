<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class PrLineItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_requisition_id',
        'item_description',
        'unit_of_measure',
        'quantity',
        'estimated_unit_cost',
        'estimated_total_cost',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'estimated_unit_cost' => 'decimal:2',
            'estimated_total_cost' => 'decimal:2',
        ];
    }

    // ─── Relationships ──────────────────────────────────

    public function purchaseRequisition(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequisition::class);
    }

    // ─── Boot ───────────────────────────────────────────

    protected static function boot()
    {
        parent::boot();

        // Auto-compute total cost when creating/updating
        static::saving(function ($item) {
            $item->estimated_total_cost = $item->quantity * $item->estimated_unit_cost;
        });
    }
}

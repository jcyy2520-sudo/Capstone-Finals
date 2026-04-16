<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class BidPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'bid_opening_id', 'vendor_id', 'amount_as_read',
        'amount_as_calculated', 'arithmetic_correction', 'rank',
    ];

    protected function casts(): array
    {
        return [
            'amount_as_read' => 'decimal:2',
            'amount_as_calculated' => 'decimal:2',
        ];
    }

    public function bidOpening(): BelongsTo { return $this->belongsTo(BidOpening::class); }
    public function vendor(): BelongsTo { return $this->belongsTo(Vendor::class); }
}

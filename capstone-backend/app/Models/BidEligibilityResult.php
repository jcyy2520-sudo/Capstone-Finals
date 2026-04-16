<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class BidEligibilityResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'bid_opening_id', 'vendor_id', 'doc_type',
        'result', 'remarks', 'overall_eligible',
    ];

    protected function casts(): array
    {
        return ['overall_eligible' => 'boolean'];
    }

    public function bidOpening(): BelongsTo { return $this->belongsTo(BidOpening::class); }
    public function vendor(): BelongsTo { return $this->belongsTo(Vendor::class); }
}

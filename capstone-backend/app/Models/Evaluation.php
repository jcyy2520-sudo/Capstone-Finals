<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'bid_opening_id', 'invitation_id', 'evaluator_id', 'evaluator_role', 'vendor_id',
        'technical_items', 'calculated_price', 'arithmetic_correction_details',
        'recommendation', 'overall_remarks', 'status', 'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'technical_items' => 'array',
            'calculated_price' => 'decimal:2',
            'submitted_at' => 'datetime',
        ];
    }

    public function bidOpening(): BelongsTo { return $this->belongsTo(BidOpening::class); }
    public function invitation(): BelongsTo { return $this->belongsTo(Invitation::class); }
    public function evaluator(): BelongsTo { return $this->belongsTo(User::class, 'evaluator_id'); }
    public function vendor(): BelongsTo { return $this->belongsTo(Vendor::class); }
}

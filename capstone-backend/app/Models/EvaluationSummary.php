<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class EvaluationSummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'bid_opening_id', 'invitation_id', 'ranked_bidders',
        'abstract_as_calculated_path', 'evaluation_report_path',
        'status', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'ranked_bidders' => 'array',
            'approved_at' => 'datetime',
        ];
    }

    public function bidOpening(): BelongsTo { return $this->belongsTo(BidOpening::class); }
    public function invitation(): BelongsTo { return $this->belongsTo(Invitation::class); }
    public function approver(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
}

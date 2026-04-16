<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;

class BidOpening extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_reference',
        'invitation_id',
        'session_date',
        'quorum_confirmed',
        'bac_members_present',
        'observers_present',
        'failure_declared',
        'failure_grounds',
        'postponed',
        'postponement_reason',
        'new_opening_date',
        'session_minutes',
        'status',
        'conducted_by',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'session_date' => 'datetime',
            'quorum_confirmed' => 'boolean',
            'bac_members_present' => 'array',
            'observers_present' => 'array',
            'failure_declared' => 'boolean',
            'postponed' => 'boolean',
            'new_opening_date' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    // ─── Relationships ──────────────────────────────────

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }

    public function conductor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'conducted_by');
    }

    public function eligibilityResults(): HasMany
    {
        return $this->hasMany(BidEligibilityResult::class);
    }

    public function bidPrices(): HasMany
    {
        return $this->hasMany(BidPrice::class);
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(BidOpeningAttendance::class);
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class);
    }

    public function evaluationSummary(): HasOne
    {
        return $this->hasOne(EvaluationSummary::class);
    }

    public function postQualifications(): HasMany
    {
        return $this->hasMany(PostQualification::class);
    }

    public function award(): HasOne
    {
        return $this->hasOne(Award::class);
    }

    // ─── Helpers ────────────────────────────────────────

    public function hasQuorum(): bool
    {
        $present = $this->bac_members_present ?? [];
        return count($present) >= 3;
    }

    public static function generateReference(string $invitationRef): string
    {
        return sprintf('BOS-%s-%s', $invitationRef, now()->format('Ymd'));
    }
}

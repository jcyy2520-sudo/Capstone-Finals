<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;

class PurchaseRequisition extends Model
{
    use HasFactory;

    protected $fillable = [
        'pr_reference',
        'app_entry_id',
        'department_id',
        'requester_id',
        'purpose',
        'date_required',
        'urgency_level',
        'emergency_justification',
        'total_value',
        'technical_specs_path',
        'status',
        'procurement_mode',
        'recommended_mode',
        'recommended_mode_justification',
        'mode_confirmed_by',
        'mode_confirmed_at',
        'return_remarks',
        'endorsed_by',
        'endorsed_at',
        'budget_certified_by',
        'budget_certified_at',
        'fund_source',
        'account_code',
        'accepted_by',
        'accepted_at',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'date_required' => 'date',
            'total_value' => 'decimal:2',
            'endorsed_at' => 'datetime',
            'budget_certified_at' => 'datetime',
            'accepted_at' => 'datetime',
            'submitted_at' => 'datetime',
            'mode_confirmed_at' => 'datetime',
        ];
    }

    // ─── Relationships ──────────────────────────────────

    public function appEntry(): BelongsTo
    {
        return $this->belongsTo(AppEntry::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function endorser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'endorsed_by');
    }

    public function budgetCertifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'budget_certified_by');
    }

    public function accepter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(PrLineItem::class)->orderBy('sort_order');
    }

    public function invitation(): HasOne
    {
        return $this->hasOne(Invitation::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function blockchainEvents(): HasMany
    {
        return $this->hasMany(BlockchainEvent::class, 'entity_id')
            ->where('entity_type', PurchaseRequisition::class);
    }

    public function latestBlockchainEvent(): HasOne
    {
        return $this->hasOne(BlockchainEvent::class, 'entity_id')
            ->where('entity_type', PurchaseRequisition::class)
            ->where('event_type', 'PR_ACCEPTED')
            ->latestOfMany('recorded_at');
    }

    // ─── Helpers ────────────────────────────────────────

    /**
     * Recompute total value from line items.
     */
    public function recomputeTotal(): void
    {
        $this->total_value = $this->lineItems()->sum('estimated_total_cost');
        $this->save();
    }

    /**
     * Generate a PR reference number.
     */
    public static function generateReference(int $departmentId): string
    {
        $dept = Department::find($departmentId);
        $year = now()->year;
        $seq = static::where('department_id', $departmentId)
            ->whereYear('created_at', $year)
            ->count() + 1;

        return sprintf('PR-%d-%s-%04d', $year, $dept?->code ?? 'GEN', $seq);
    }
}

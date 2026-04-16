<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class AppEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'project_title',
        'description',
        'mfo_code',
        'mfo_name_snapshot',
        'pap_code',
        'uacs_object_code',
        'approved_budget_reference',
        'coa_trace_tag',
        'category',
        'mode',
        'abc',
        'unit_of_measurement',
        'quantity',
        'fund_source',
        'account_code',
        'implementing_unit',
        'target_start_quarter',
        'target_completion_quarter',
        'fiscal_year',
        'justification',
        'attachment_path',
        'status',
        'is_supplemental',
        'version',
        'created_by',
        'approved_by',
        'approved_at',
        'submitted_at',
        'budget_certified_by',
        'budget_certified_at',
        'return_remarks',
    ];

    protected function casts(): array
    {
        return [
            'abc' => 'decimal:2',
            'is_supplemental' => 'boolean',
            'approved_at' => 'datetime',
            'submitted_at' => 'datetime',
            'budget_certified_at' => 'datetime',
        ];
    }

    // ─── Relationships ──────────────────────────────────

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function purchaseRequisitions(): HasMany
    {
        return $this->hasMany(PurchaseRequisition::class);
    }

    // ─── Helpers ────────────────────────────────────────

    /**
     * Get remaining budget (ABC minus total of accepted PRs).
     */
    public function getRemainingBudgetAttribute(): float
    {
        $committedTotal = $this->purchaseRequisitions()
            ->whereNotIn('status', ['draft', 'cancelled', 'returned'])
            ->sum('total_value');

        return (float) $this->abc - $committedTotal;
    }

    /**
     * Suggest procurement mode based on ABC amount.
     */
    public function suggestMode(): string
    {
        if ($this->abc > 2000000) {
            return 'competitive_bidding';
        }
        return 'small_value_procurement';
    }
}

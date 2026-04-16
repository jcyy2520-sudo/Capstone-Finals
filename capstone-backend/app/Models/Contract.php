<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_reference', 'award_id', 'vendor_id', 'purchase_requisition_id',
        'ntp_date', 'duration_days', 'end_date', 'contract_amount',
        'contract_document_path', 'contract_document_hash',
        'milestones', 'progress_percentage', 'status',
    ];

    protected function casts(): array
    {
        return [
            'ntp_date' => 'date',
            'end_date' => 'date',
            'contract_amount' => 'decimal:2',
            'milestones' => 'array',
            'progress_percentage' => 'decimal:2',
        ];
    }

    public function award(): BelongsTo { return $this->belongsTo(Award::class); }
    public function vendor(): BelongsTo { return $this->belongsTo(Vendor::class); }
    public function purchaseRequisition(): BelongsTo { return $this->belongsTo(PurchaseRequisition::class); }
    public function amendments(): HasMany { return $this->hasMany(ContractAmendment::class); }
    public function extensions(): HasMany { return $this->hasMany(ContractExtension::class); }
    public function suspensions(): HasMany { return $this->hasMany(ContractSuspension::class); }
    public function inspectionReports(): HasMany { return $this->hasMany(InspectionAcceptanceReport::class); }
    public function invoices(): HasMany { return $this->hasMany(Invoice::class); }

    public function getDaysRemainingAttribute(): int
    {
        return max(0, now()->diffInDays($this->end_date, false));
    }

    public function isOverdue(): bool
    {
        return $this->status === 'active' && $this->end_date->isPast();
    }

    public static function generateReference(): string
    {
        $year = now()->year;
        $seq = static::whereYear('created_at', $year)->count() + 1;
        return sprintf('CON-%d-%04d', $year, $seq);
    }
}

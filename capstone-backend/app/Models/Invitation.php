<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;

class Invitation extends Model
{
    use HasFactory;
    
    // ─── Procurement Mode Constants ─────────────────────
    const MODE_COMPETITIVE_BIDDING = 'competitive_bidding';
    const MODE_LIMITED_SOURCE = 'limited_source_bidding';
    const MODE_DIRECT_CONTRACTING = 'direct_contracting';
    const MODE_REPEAT_ORDER = 'repeat_order';
    const MODE_SHOPPING_A = 'shopping_52_1a';
    const MODE_SHOPPING_B = 'shopping_52_1b';
    const MODE_NEGOTIATED = 'negotiated_procurement';
    const MODE_SVP = 'small_value_procurement';
    const MODE_DIRECT_ACQUISITION = 'direct_acquisition';
    const MODE_DIRECT_SALES = 'direct_sales';
    const MODE_STI = 'sti_procurement';

    // ─── Status Constants ───────────────────────────────
    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING_CHAIR = 'pending_chairperson_approval';
    const STATUS_PENDING_HOPE = 'pending_hope_approval';
    const STATUS_APPROVED = 'approved';
    const STATUS_POSTED = 'posted';
    const STATUS_SENT = 'sent';
    const STATUS_RECORDED = 'recorded';
    const STATUS_CLOSED = 'closed';

    protected $fillable = [
        'reference_number',
        'purchase_requisition_id',
        'type',
        'project_title',
        'procuring_entity',
        'abc',
        'fund_source',
        'procurement_mode',
        'bid_document_cost',
        'eligibility_check_date',
        'pre_bid_conference_date',
        'submission_deadline',
        'opening_date',
        'opening_venue',
        'contact_person',
        'contact_email',
        'contact_phone',
        'philgeps_reference',
        'additional_requirements',
        'special_conditions',
        'technical_specifications',
        'delivery_location',
        'delivery_schedule',
        'payment_terms',
        'alternative_mode_justification',
        'hope_approval_reference',
        'selected_supplier_name',
        'selected_supplier_details',
        'mode_specific_data',
        'status',
        'posted_at',
        'created_by',
        'approved_by',
        'approved_at',
        'hope_approved_by',
        'hope_approved_at',
        'return_remarks',
        'returned_by',
        'returned_at',
    ];

    protected function casts(): array
    {
        return [
            'abc' => 'decimal:2',
            'bid_document_cost' => 'decimal:2',
            'eligibility_check_date' => 'date',
            'pre_bid_conference_date' => 'date',
            'submission_deadline' => 'datetime',
            'opening_date' => 'datetime',
            'posted_at' => 'datetime',
            'approved_at' => 'datetime',
            'hope_approved_at' => 'datetime',
            'returned_at' => 'datetime',
            'mode_specific_data' => 'array',
        ];
    }

    // ─── Relationships ──────────────────────────────────

    public function purchaseRequisition(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequisition::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rfqInvitations(): HasMany
    {
        return $this->hasMany(RfqInvitation::class);
    }

    public function bidSubmissions(): HasMany
    {
        return $this->hasMany(BidSubmission::class);
    }

    public function prescreenings(): HasMany
    {
        return $this->hasMany(Prescreening::class);
    }

    public function bidOpening(): HasOne
    {
        return $this->hasOne(BidOpening::class);
    }

    public function bacResolutions(): HasMany
    {
        return $this->hasMany(BacResolution::class);
    }

    public function overrides(): HasMany
    {
        return $this->hasMany(InvitationOverride::class);
    }

    public function hopeApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hope_approved_by');
    }

    // ─── Reference Number Generation ────────────────────

    public static function generateReference(string $type): string
    {
        $normalizedType = strtolower($type);
        $prefix = match ($normalizedType) {
            'itb' => 'ITB',
            'rfq' => 'RFQ',
            'limited_source' => 'LSB',
            default => 'DIR',
        };
        $year = now()->year;
        $seq = static::where('type', $normalizedType)
            ->whereYear('created_at', $year)
            ->count() + 1;

        return sprintf('%s-%d-%04d', $prefix, $year, $seq);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'business_name',
        'business_type',
        'dti_sec_cda_number',
        'philgeps_number',
        'tin',
        'address',
        'contact_person',
        'contact_email',
        'contact_mobile',
        'procurement_categories',
        'status',
        'is_blacklisted',
        'blacklist_details',
        'blacklist_checked_at',
        'email_verification_token',
        'email_verified_at',
    ];

    protected function casts(): array
    {
        return [
            'procurement_categories' => 'array',
            'is_blacklisted' => 'boolean',
            'blacklist_checked_at' => 'datetime',
            'email_verified_at' => 'datetime',
        ];
    }

    // ─── Relationships ──────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(VendorDocument::class);
    }

    public function rfqInvitations(): HasMany
    {
        return $this->hasMany(RfqInvitation::class);
    }

    public function bidSubmissions(): HasMany
    {
        return $this->hasMany(BidSubmission::class);
    }

    public function awards(): HasMany
    {
        return $this->hasMany(Award::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function physicalVerifications(): HasMany
    {
        return $this->hasMany(VendorPhysicalVerification::class);
    }

    // ─── Status Helpers ─────────────────────────────────

    public function isPhysicallyVerified(): bool
    {
        $latest = $this->physicalVerifications()->latest('verified_at')->first();
        if (!$latest) return false;

        // Check if all required items are "passed"
        $results = $latest->checklist_results;
        $required = [
            'DTI / SEC / CDA Registration Certificate',
            'Mayor\'s / Business Permit (current year)',
            'Tax Clearance (BIR-issued, valid)',
            'PhilGEPS Registration Certificate (Gold or Platinum)',
            'Audited Financial Statements (latest year)',
            'Statement of Ongoing Contracts (notarized)',
            'Statement of Single Largest Completed Contract (SLCC)',
        ];

        foreach ($required as $item) {
            $found = false;
            foreach ($results as $res) {
                if ($res['item'] === $item && $res['status'] === 'passed') {
                    $found = true;
                    break;
                }
            }
            if (!$found) return false;
        }

        return true;
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isBlacklisted(): bool
    {
        return $this->is_blacklisted || $this->status === 'blacklisted';
    }

    public function canBid(): bool
    {
        return $this->isApproved() && !$this->isBlacklisted();
    }
}

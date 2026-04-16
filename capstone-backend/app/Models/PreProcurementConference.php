<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class PreProcurementConference extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_requisition_id',
        'invitation_id',
        'conference_date',
        'venue',
        'agenda',
        'attendees',
        'abc_validated',
        'specs_validated',
        'bidding_docs_validated',
        'minutes',
        'minutes_document_path',
        'outcome',
        'remarks',
        'conducted_by',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'conference_date' => 'datetime',
            'attendees' => 'array',
            'abc_validated' => 'boolean',
            'specs_validated' => 'boolean',
            'bidding_docs_validated' => 'boolean',
        ];
    }

    public function purchaseRequisition(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequisition::class);
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }

    public function conductor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'conducted_by');
    }
}

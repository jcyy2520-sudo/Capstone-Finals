<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class PreBidConference extends Model
{
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'conference_date',
        'venue',
        'attendees',
        'minutes',
        'queries_raised',
        'supplemental_bid_bulletins',
        'status',
        'conducted_by',
    ];

    protected function casts(): array
    {
        return [
            'conference_date' => 'datetime',
            'attendees' => 'array',
            'queries_raised' => 'array',
            'supplemental_bid_bulletins' => 'array',
        ];
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

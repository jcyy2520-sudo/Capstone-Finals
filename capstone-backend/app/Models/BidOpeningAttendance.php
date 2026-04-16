<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class BidOpeningAttendance extends Model
{
    use HasFactory;

    protected $table = 'bid_opening_attendance';

    protected $fillable = ['bid_opening_id', 'vendor_id', 'present'];

    protected function casts(): array
    {
        return ['present' => 'boolean'];
    }

    public function bidOpening(): BelongsTo { return $this->belongsTo(BidOpening::class); }
    public function vendor(): BelongsTo { return $this->belongsTo(Vendor::class); }
}

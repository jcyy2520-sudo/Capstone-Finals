<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class ChainAnchor extends Model
{
    use HasFactory;

    protected $fillable = [
        'merkle_root',
        'block_range_start',
        'block_range_end',
        'event_count',
        'tx_hash',
        'status',
        'proof_data',
        'anchored_at',
    ];

    protected function casts(): array
    {
        return [
            'proof_data' => 'array',
            'block_range_start' => 'integer',
            'block_range_end' => 'integer',
            'event_count' => 'integer',
            'anchored_at' => 'datetime',
        ];
    }

    public function blockchainEvents(): HasMany
    {
        return $this->hasMany(BlockchainEvent::class, 'anchor_id');
    }

    public function isAnchored(): bool
    {
        return $this->status === 'anchored';
    }
}

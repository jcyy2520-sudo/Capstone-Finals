<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class EthereumTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'blockchain_event_id',
        'tx_hash',
        'contract_address',
        'function_name',
        'input_data',
        'gas_used',
        'block_number_eth',
        'status',
        'error_message',
        'confirmed_at',
    ];

    protected function casts(): array
    {
        return [
            'input_data' => 'array',
            'gas_used' => 'integer',
            'block_number_eth' => 'integer',
            'confirmed_at' => 'datetime',
        ];
    }

    public function blockchainEvent(): BelongsTo
    {
        return $this->belongsTo(BlockchainEvent::class);
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function markConfirmed(int $gasUsed, int $blockNumber): void
    {
        $this->update([
            'status' => 'confirmed',
            'gas_used' => $gasUsed,
            'block_number_eth' => $blockNumber,
            'confirmed_at' => now(),
        ]);
    }

    public function markFailed(string $error): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $error,
        ]);
    }
}

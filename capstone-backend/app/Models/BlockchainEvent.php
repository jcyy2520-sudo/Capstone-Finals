<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class BlockchainEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_type', 'procurement_id', 'entity_type', 'entity_id',
        'actor_id', 'document_hash', 'metadata_hash',
        'previous_hash', 'block_hash', 'block_number',
        'metadata', 'recorded_at',
        'eth_tx_hash', 'anchor_id',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'recorded_at' => 'datetime',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function ethereumTransaction(): BelongsTo
    {
        return $this->belongsTo(EthereumTransaction::class, 'eth_tx_hash', 'tx_hash');
    }

    public function chainAnchor(): BelongsTo
    {
        return $this->belongsTo(ChainAnchor::class, 'anchor_id');
    }

    /**
     * Whether this event has been confirmed on the Ethereum network.
     */
    public function isOnChain(): bool
    {
        return $this->eth_tx_hash !== null || $this->anchor_id !== null;
    }

    // ─── Simulated Blockchain Logic ─────────────────────

    /**
     * Record a new blockchain event with chained hashing.
     * Each block's hash includes the previous block's hash, creating an immutable chain.
     */
    public static function recordEvent(
        string $eventType,
        ?int $actorId = null,
        ?string $entityType = null,
        ?int $entityId = null,
        ?string $documentHash = null,
        array $metadata = []
    ): self {
        // Get the previous block
        $previousBlock = static::orderBy('block_number', 'desc')->first();
        $previousHash = $previousBlock?->block_hash ?? str_repeat('0', 64); // Genesis block
        $blockNumber = ($previousBlock?->block_number ?? 0) + 1;

        // Compute metadata hash
        $metadataHash = hash('sha256', json_encode($metadata));

        // Compute block hash (chain link) — includes previous hash for immutability
        $blockData = implode('|', [
            $eventType,
            $actorId ?? '',
            $entityType ?? '',
            $entityId ?? '',
            $documentHash ?? '',
            $metadataHash,
            $previousHash,
            $blockNumber,
            now()->toIso8601String(),
        ]);
        $blockHash = hash('sha256', $blockData);

        return static::create([
            'event_type' => $eventType,
            'procurement_id' => $metadata['procurement_id'] ?? null,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'actor_id' => $actorId,
            'document_hash' => $documentHash,
            'metadata_hash' => $metadataHash,
            'previous_hash' => $previousHash,
            'block_hash' => $blockHash,
            'block_number' => $blockNumber,
            'metadata' => $metadata,
            'recorded_at' => now(),
        ]);
    }

    /**
     * Verify the integrity of the blockchain by checking the chain of hashes.
     * Returns true if the chain is intact, false if tampering is detected.
     */
    public static function verifyChainIntegrity(): array
    {
        $blocks = static::orderBy('block_number')->get();
        $issues = [];

        foreach ($blocks as $index => $block) {
            if ($index === 0) {
                // Genesis block — previous_hash should be all zeros
                if ($block->previous_hash !== str_repeat('0', 64)) {
                    $issues[] = "Block #{$block->block_number}: Genesis block has invalid previous_hash";
                }
                continue;
            }

            $previousBlock = $blocks[$index - 1];

            // Check that this block's previous_hash matches the actual previous block's hash
            if ($block->previous_hash !== $previousBlock->block_hash) {
                $issues[] = "Block #{$block->block_number}: Chain broken — previous_hash mismatch (expected: {$previousBlock->block_hash}, got: {$block->previous_hash})";
            }
        }

        return [
            'intact' => empty($issues),
            'total_blocks' => $blocks->count(),
            'issues' => $issues,
        ];
    }

    /**
     * Get the full audit trail for a specific procurement.
     */
    public static function getAuditTrail(string $procurementId): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('procurement_id', $procurementId)
            ->orderBy('block_number')
            ->get();
    }

    /**
     * Get all actions performed by a specific user.
     */
    public static function getActorHistory(int $actorId, ?string $startDate = null, ?string $endDate = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = static::where('actor_id', $actorId);

        if ($startDate) {
            $query->where('recorded_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('recorded_at', '<=', $endDate);
        }

        return $query->orderBy('block_number')->get();
    }

    // ─── Event Type Constants ───────────────────────────

    const APP_APPROVED = 'APP_APPROVED';
    const PR_ACCEPTED = 'PR_ACCEPTED';
    const ITB_POSTED = 'ITB_POSTED';
    const RFQ_SENT = 'RFQ_SENT';
    const BID_OPENING_COMPLETED = 'BID_OPENING_COMPLETED';
    const EVALUATION_COMPLETED = 'EVALUATION_COMPLETED';
    const POST_QUAL_COMPLETED = 'POST_QUAL_COMPLETED';
    const NOA_ISSUED = 'NOA_ISSUED';
    const NTP_ISSUED = 'NTP_ISSUED';
    const CONTRACT_SIGNED = 'CONTRACT_SIGNED';
    const AMENDMENT_APPROVED = 'AMENDMENT_APPROVED';
    const CONTRACT_TERMINATED = 'CONTRACT_TERMINATED';
    const DOCUMENT_HASH_MISMATCH = 'DOCUMENT_HASH_MISMATCH';
    const PRESCREENING_COMPLETED = 'PRESCREENING_COMPLETED';
    const BUDGET_CERTIFIED = 'BUDGET_CERTIFIED';
    const PAYMENT_RECORDED = 'PAYMENT_RECORDED';
    const BID_SUBMITTED = 'BID_SUBMITTED';
    const PRE_PROCUREMENT_CONFERENCE_APPROVED = 'PRE_PROCUREMENT_CONFERENCE_APPROVED';
    const DOCUMENT_REGISTERED = 'DOCUMENT_REGISTERED';
}

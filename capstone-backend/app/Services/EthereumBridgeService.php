<?php

namespace App\Services;

use App\Models\BlockchainEvent;
use App\Models\EthereumTransaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Bridge between the Laravel application and the Ethereum smart contracts
 * via the Node.js bridge service. All calls are wrapped in try-catch so
 * that bridge downtime does NOT break the core procurement workflow —
 * the simulated chain continues regardless.
 */
class EthereumBridgeService
{
    private string $baseUrl;
    private string $apiKey;
    private bool $enabled;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.ethereum_bridge.url', 'http://127.0.0.1:3001'), '/');
        $this->apiKey = config('services.ethereum_bridge.api_key', '');
        $this->enabled = !empty($this->apiKey) && !empty($this->baseUrl);
    }

    // ── Procurement Registry ────────────────────────────

    /**
     * Register a procurement on the Ethereum blockchain.
     */
    public function registerProcurement(string $procurementId, string $title, float $abc): ?EthereumTransaction
    {
        return $this->call('POST', '/api/procurement/register', [
            'procurementId' => $procurementId,
            'title' => $title,
            'abc' => $abc,
        ], 'registerProcurement');
    }

    /**
     * Anchor a critical event hash on-chain.
     * Event types: 0=ITB_POSTED, 1=BID_SUBMITTED, 2=BID_OPENING_COMPLETED,
     *              3=NOA_ISSUED, 4=CONTRACT_SIGNED, 5=PAYMENT_RECORDED, 6=DOCUMENT_HASH_MISMATCH
     */
    public function anchorEvent(string $procurementId, string $eventHash, int $eventType, ?int $blockchainEventId = null): ?EthereumTransaction
    {
        return $this->call('POST', '/api/procurement/anchor-event', [
            'procurementId' => $procurementId,
            'eventHash' => $eventHash,
            'eventType' => $eventType,
        ], 'anchorEvent', $blockchainEventId);
    }

    // ── Bid Manager ─────────────────────────────────────

    /**
     * Open a bidding session on-chain.
     */
    public function openBidding(string $procurementId, float $abc, int $deadline): ?EthereumTransaction
    {
        return $this->call('POST', '/api/bidding/open', [
            'procurementId' => $procurementId,
            'abc' => $abc,
            'deadline' => $deadline,
        ], 'openBidding');
    }

    /**
     * Submit a sealed bid commitment on-chain.
     */
    public function submitSealedBid(string $procurementId, string $commitHash): ?EthereumTransaction
    {
        return $this->call('POST', '/api/bidding/submit-sealed', [
            'procurementId' => $procurementId,
            'commitHash' => $commitHash,
        ], 'submitSealedBid');
    }

    /**
     * Close the bidding period on-chain.
     */
    public function closeBidding(string $procurementId): ?EthereumTransaction
    {
        return $this->call('POST', '/api/bidding/close', [
            'procurementId' => $procurementId,
        ], 'closeBidding');
    }

    /**
     * Reveal a sealed bid on-chain.
     */
    public function revealBid(string $procurementId, string $bidderAddress, float $amount, string $salt): ?EthereumTransaction
    {
        return $this->call('POST', '/api/bidding/reveal', [
            'procurementId' => $procurementId,
            'bidderAddress' => $bidderAddress,
            'amount' => $amount,
            'salt' => $salt,
        ], 'revealBid');
    }

    /**
     * Finalize bid reveals and determine lowest compliant bid.
     */
    public function finalizeReveals(string $procurementId): ?EthereumTransaction
    {
        return $this->call('POST', '/api/bidding/finalize', [
            'procurementId' => $procurementId,
        ], 'finalizeReveals');
    }

    // ── Payment Tracker ─────────────────────────────────

    /**
     * Register a contract on-chain for payment tracking.
     */
    public function registerContract(string $contractId, string $procurementId, string $vendorAddress, float $totalAmount): ?EthereumTransaction
    {
        return $this->call('POST', '/api/payment/register-contract', [
            'contractId' => $contractId,
            'procurementId' => $procurementId,
            'vendorAddress' => $vendorAddress,
            'totalAmount' => $totalAmount,
        ], 'registerContract');
    }

    /**
     * Record a payment milestone on-chain.
     */
    public function recordPayment(string $contractId, int $milestoneIndex, float $amount): ?EthereumTransaction
    {
        return $this->call('POST', '/api/payment/record', [
            'contractId' => $contractId,
            'milestoneIndex' => $milestoneIndex,
            'amount' => $amount,
        ], 'recordPayment');
    }

    // ── Verification ────────────────────────────────────

    /**
     * Verify a transaction on the Ethereum network.
     */
    public function verifyTransaction(string $txHash): ?array
    {
        if (!$this->enabled) return null;

        try {
            $response = Http::timeout(10)
                ->get("{$this->baseUrl}/api/verify/{$txHash}");

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Throwable $e) {
            Log::warning("[EthereumBridge] verifyTransaction failed: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Check if the bridge service is healthy and reachable.
     */
    public function isHealthy(): bool
    {
        if (!$this->enabled) return false;

        try {
            $response = Http::timeout(5)->get("{$this->baseUrl}/api/health");
            return $response->successful();
        } catch (\Throwable) {
            return false;
        }
    }

    // ── Internal ────────────────────────────────────────

    /**
     * Make an authenticated HTTP call to the bridge service.
     * On failure, logs a warning and returns null — never throws.
     */
    private function call(string $method, string $path, array $data, string $functionName, ?int $blockchainEventId = null): ?EthereumTransaction
    {
        if (!$this->enabled) {
            Log::info("[EthereumBridge] Bridge not configured — skipping {$functionName}");
            return null;
        }

        try {
            $response = Http::timeout(30)
                ->withToken($this->apiKey)
                ->$method("{$this->baseUrl}{$path}", $data);

            if ($response->successful() && $response->json('success')) {
                $json = $response->json();

                return EthereumTransaction::create([
                    'blockchain_event_id' => $blockchainEventId,
                    'tx_hash' => $json['txHash'],
                    'contract_address' => null,
                    'function_name' => $functionName,
                    'input_data' => $data,
                    'gas_used' => null,
                    'block_number_eth' => $json['blockNumber'] ?? null,
                    'status' => 'confirmed',
                    'confirmed_at' => now(),
                ]);
            }

            Log::warning("[EthereumBridge] {$functionName} failed: " . $response->body());
            return null;
        } catch (\Throwable $e) {
            Log::warning("[EthereumBridge] {$functionName} error: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Map BlockchainEvent event types to on-chain event type integers.
     */
    public static function mapEventType(string $eventType): ?int
    {
        return match ($eventType) {
            BlockchainEvent::ITB_POSTED => 0,
            BlockchainEvent::BID_SUBMITTED => 1,
            BlockchainEvent::BID_OPENING_COMPLETED => 2,
            BlockchainEvent::NOA_ISSUED => 3,
            BlockchainEvent::CONTRACT_SIGNED => 4,
            BlockchainEvent::PAYMENT_RECORDED => 5,
            BlockchainEvent::DOCUMENT_HASH_MISMATCH => 6,
            default => null,
        };
    }

    /**
     * List of event types that should be anchored on-chain.
     */
    public static function criticalEventTypes(): array
    {
        return [
            BlockchainEvent::ITB_POSTED,
            BlockchainEvent::BID_SUBMITTED,
            BlockchainEvent::BID_OPENING_COMPLETED,
            BlockchainEvent::NOA_ISSUED,
            BlockchainEvent::CONTRACT_SIGNED,
            BlockchainEvent::PAYMENT_RECORDED,
            BlockchainEvent::DOCUMENT_HASH_MISMATCH,
        ];
    }
}

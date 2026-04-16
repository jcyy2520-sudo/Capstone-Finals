<?php

namespace Tests\Unit;

use App\Models\BlockchainEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlockchainIntegrityTest extends TestCase
{
    use RefreshDatabase;

    public function test_empty_chain_is_valid(): void
    {
        $result = BlockchainEvent::verifyChainIntegrity();

        $this->assertTrue($result['intact']);
        $this->assertEquals(0, $result['total_blocks']);
        $this->assertEmpty($result['issues']);
    }

    public function test_single_block_chain_is_valid(): void
    {
        BlockchainEvent::create([
            'block_number' => 1,
            'event_type' => 'APP_ENTRY_CREATED',
            'actor_id' => 1,
            'entity_type' => 'App\Models\AppEntry',
            'entity_id' => 1,
            'document_hash' => hash('sha256', 'test'),
            'previous_hash' => str_repeat('0', 64),
            'block_hash' => hash('sha256', 'block1'),
            'metadata' => json_encode(['test' => true]),
        ]);

        $result = BlockchainEvent::verifyChainIntegrity();

        $this->assertTrue($result['intact']);
        $this->assertEquals(1, $result['total_blocks']);
    }

    public function test_valid_chain_of_three_blocks(): void
    {
        $genesisHash = hash('sha256', 'genesis');
        BlockchainEvent::create([
            'block_number' => 1,
            'event_type' => 'APP_ENTRY_CREATED',
            'actor_id' => 1,
            'entity_type' => 'App\Models\AppEntry',
            'entity_id' => 1,
            'document_hash' => hash('sha256', 'doc1'),
            'previous_hash' => str_repeat('0', 64),
            'block_hash' => $genesisHash,
            'metadata' => null,
        ]);

        $block2Hash = hash('sha256', 'block2');
        BlockchainEvent::create([
            'block_number' => 2,
            'event_type' => 'APP_ENTRY_SUBMITTED',
            'actor_id' => 1,
            'entity_type' => 'App\Models\AppEntry',
            'entity_id' => 1,
            'document_hash' => hash('sha256', 'doc2'),
            'previous_hash' => $genesisHash,
            'block_hash' => $block2Hash,
            'metadata' => null,
        ]);

        BlockchainEvent::create([
            'block_number' => 3,
            'event_type' => 'PR_CREATED',
            'actor_id' => 2,
            'entity_type' => 'App\Models\PurchaseRequisition',
            'entity_id' => 1,
            'document_hash' => hash('sha256', 'doc3'),
            'previous_hash' => $block2Hash,
            'block_hash' => hash('sha256', 'block3'),
            'metadata' => null,
        ]);

        $result = BlockchainEvent::verifyChainIntegrity();

        $this->assertTrue($result['intact']);
        $this->assertEquals(3, $result['total_blocks']);
    }

    public function test_tampered_chain_detected(): void
    {
        $genesisHash = hash('sha256', 'genesis');
        BlockchainEvent::create([
            'block_number' => 1,
            'event_type' => 'APP_ENTRY_CREATED',
            'actor_id' => 1,
            'entity_type' => 'App\Models\AppEntry',
            'entity_id' => 1,
            'document_hash' => hash('sha256', 'doc1'),
            'previous_hash' => str_repeat('0', 64),
            'block_hash' => $genesisHash,
            'metadata' => null,
        ]);

        // Block 2 has WRONG previous_hash (chain break)
        BlockchainEvent::create([
            'block_number' => 2,
            'event_type' => 'APP_ENTRY_SUBMITTED',
            'actor_id' => 1,
            'entity_type' => 'App\Models\AppEntry',
            'entity_id' => 1,
            'document_hash' => hash('sha256', 'doc2'),
            'previous_hash' => hash('sha256', 'TAMPERED'),
            'block_hash' => hash('sha256', 'block2'),
            'metadata' => null,
        ]);

        $result = BlockchainEvent::verifyChainIntegrity();

        $this->assertFalse($result['intact']);
        $this->assertNotEmpty($result['issues']);
        $this->assertStringContainsString('Chain broken', $result['issues'][0]);
    }
}

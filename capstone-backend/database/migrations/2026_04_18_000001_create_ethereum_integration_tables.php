<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ethereum integration tables for the hybrid blockchain approach.
     * Tracks on-chain transactions and Merkle batch anchors.
     */
    public function up(): void
    {
        // Ethereum Transactions — tracks every on-chain transaction
        Schema::create('ethereum_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blockchain_event_id')->nullable()->constrained('blockchain_events')->nullOnDelete();
            $table->string('tx_hash', 66)->unique();
            $table->string('contract_address', 42)->nullable();
            $table->string('function_name', 100)->nullable();
            $table->json('input_data')->nullable();
            $table->unsignedBigInteger('gas_used')->nullable();
            $table->unsignedBigInteger('block_number_eth')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'failed'])->default('pending');
            $table->text('error_message')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('blockchain_event_id');
        });

        // Chain Anchors — Merkle batch anchoring of non-critical events
        Schema::create('chain_anchors', function (Blueprint $table) {
            $table->id();
            $table->string('merkle_root', 66);
            $table->unsignedBigInteger('block_range_start');
            $table->unsignedBigInteger('block_range_end');
            $table->unsignedInteger('event_count');
            $table->string('tx_hash', 66)->nullable();
            $table->enum('status', ['pending', 'anchored', 'failed'])->default('pending');
            $table->json('proof_data')->nullable();
            $table->timestamp('anchored_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });

        // Add Ethereum columns to bid_submissions
        Schema::table('bid_submissions', function (Blueprint $table) {
            $table->string('sealed_commit_hash', 66)->nullable()->after('document_hash');
            $table->string('sealed_salt', 255)->nullable()->after('sealed_commit_hash');
            $table->string('on_chain_tx_hash', 66)->nullable()->after('sealed_salt');
        });

        // Add Ethereum columns to blockchain_events
        Schema::table('blockchain_events', function (Blueprint $table) {
            $table->string('eth_tx_hash', 66)->nullable()->after('block_hash');
            $table->foreignId('anchor_id')->nullable()->after('eth_tx_hash')
                  ->constrained('chain_anchors')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('blockchain_events', function (Blueprint $table) {
            $table->dropForeign(['anchor_id']);
            $table->dropColumn(['eth_tx_hash', 'anchor_id']);
        });

        Schema::table('bid_submissions', function (Blueprint $table) {
            $table->dropColumn(['sealed_commit_hash', 'sealed_salt', 'on_chain_tx_hash']);
        });

        Schema::dropIfExists('chain_anchors');
        Schema::dropIfExists('ethereum_transactions');
    }
};

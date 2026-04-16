<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Simulated Blockchain audit trail + system audit logs + notifications
     * Uses SHA-256 hashing and immutable records to simulate blockchain behavior.
     */
    public function up(): void
    {
        // Blockchain Events — immutable audit trail (simulated blockchain)
        Schema::create('blockchain_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_type', 100); // APP_APPROVED, NOA_ISSUED, etc.
            $table->string('procurement_id')->nullable(); // Reference to any procurement entity
            $table->string('entity_type')->nullable(); // Polymorphic: App\Models\Award, etc.
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('document_hash', 64)->nullable(); // SHA-256 of document
            $table->string('metadata_hash', 64)->nullable(); // SHA-256 of event metadata
            $table->string('previous_hash', 64)->nullable(); // Hash of previous block (chain link)
            $table->string('block_hash', 64); // SHA-256 hash of this entire block
            $table->unsignedBigInteger('block_number'); // Sequential block number
            $table->json('metadata')->nullable(); // Additional event-specific data
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index('event_type');
            $table->index('block_number');
            $table->index(['entity_type', 'entity_id']);
            $table->index('actor_id');
        });

        // System Audit Logs — tracks all user actions
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 100); // LOGIN, CREATE_PR, APPROVE_NOA, etc.
            $table->string('entity_type')->nullable(); // Model class
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->json('old_values')->nullable(); // Previous state (for edits)
            $table->json('new_values')->nullable(); // New state (for edits)
            $table->boolean('success')->default(true);
            $table->text('description')->nullable();
            $table->timestamp('created_at');

            $table->index(['user_id', 'created_at']);
            $table->index('action');
            $table->index(['entity_type', 'entity_id']);
        });

        // Procurement Notifications (custom table — not Laravel's default)
        Schema::create('procurement_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipient_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 100); // pr_submitted, noa_issued, deadline_warning, etc.
            $table->string('title');
            $table->text('message');
            $table->string('entity_type')->nullable(); // Polymorphic reference
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('action_url')->nullable(); // Link to the relevant page
            $table->enum('priority', ['low', 'normal', 'high', 'critical'])->default('normal');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('email_sent_at')->nullable();
            $table->timestamps();

            $table->index(['recipient_id', 'read_at']);
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('procurement_notifications');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('blockchain_events');
    }
};

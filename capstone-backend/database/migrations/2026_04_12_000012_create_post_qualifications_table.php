<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Post-Qualification evaluation (SRS Section 2.7)
     */
    public function up(): void
    {
        Schema::create('post_qualifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bid_opening_id')->constrained('bid_openings');
            $table->foreignId('invitation_id')->constrained('invitations');
            $table->foreignId('vendor_id')->constrained('vendors');
            $table->unsignedSmallInteger('rank'); // 1 = LCB, 2 = next, etc.
            $table->json('document_results')->nullable(); // [{doc_type, status, remarks}]
            $table->enum('result', [
                'pending',
                'passed',
                'failed',
            ])->default('pending');
            $table->text('failure_reason')->nullable();
            $table->string('report_path')->nullable(); // Post-qualification report PDF
            $table->foreignId('evaluated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('invitation_sent_at')->nullable();
            $table->timestamp('documents_submitted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['bid_opening_id', 'rank']);
        });

        // BAC Resolutions (used across multiple phases)
        Schema::create('bac_resolutions', function (Blueprint $table) {
            $table->id();
            $table->string('resolution_reference')->unique(); // BACR-[YEAR]-[SEQ]
            $table->foreignId('invitation_id')->constrained('invitations');
            $table->enum('type', [
                'lcb_declaration',
                'lcrb_declaration',
                'award_recommendation',
                'failure_of_bidding',
                'other',
            ]);
            $table->text('subject');
            $table->text('body')->nullable();
            $table->string('document_path')->nullable(); // Uploaded signed resolution
            $table->string('document_hash', 64)->nullable(); // SHA-256 hash
            $table->json('signatories')->nullable(); // [{user_id, signed_at}]
            $table->unsignedSmallInteger('min_signatures_required')->default(3);
            $table->enum('status', ['draft', 'pending_signatures', 'signed', 'approved_by_hope'])->default('draft');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('hope_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('hope_approved_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bac_resolutions');
        Schema::dropIfExists('post_qualifications');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Bid Opening Session + Results + Prices (SRS Section 4.6.1)
     */
    public function up(): void
    {
        // Bid Opening Session
        Schema::create('bid_openings', function (Blueprint $table) {
            $table->id();
            $table->string('session_reference')->unique(); // BOS-[ITB/RFQ]-[DATE]
            $table->foreignId('invitation_id')->constrained('invitations');
            $table->dateTime('session_date');
            $table->boolean('quorum_confirmed')->default(false);
            $table->json('bac_members_present')->nullable(); // [{member_id, confirmed_at}]
            $table->json('observers_present')->nullable(); // Array of observer names
            $table->boolean('failure_declared')->default(false);
            $table->text('failure_grounds')->nullable();
            $table->boolean('postponed')->default(false);
            $table->text('postponement_reason')->nullable();
            $table->dateTime('new_opening_date')->nullable();
            $table->text('session_minutes')->nullable();
            $table->enum('status', [
                'scheduled',
                'in_progress',
                'completed',
                'postponed',
                'failed',
                'EVALUATION_APPROVED',
                'POST_QUALIFICATION_ONGOING',
                'POST_QUALIFICATION_PASSED',
                'POST_QUALIFICATION_FAILED',
                'BAC_RESOLUTION_SIGNED',
                'AWARD_RECOMMENDED',
                'NOA_ISSUED',
                'NOA_ACKNOWLEDGED',
                'AWARD_CANCELLED',
                'CLOSED',
            ])->default('scheduled');
            $table->foreignId('conducted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });

        // Eligibility Pass/Fail per document per bidder
        Schema::create('bid_eligibility_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bid_opening_id')->constrained('bid_openings')->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained('vendors');
            $table->string('doc_type', 100);
            $table->enum('result', ['pass', 'fail']);
            $table->text('remarks')->nullable(); // Reason for fail
            $table->boolean('overall_eligible')->default(false);
            $table->timestamps();

            $table->index(['bid_opening_id', 'vendor_id']);
        });

        // Bid Prices As Read (financial envelope)
        Schema::create('bid_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bid_opening_id')->constrained('bid_openings')->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained('vendors');
            $table->decimal('amount_as_read', 15, 2); // Exact amount from sealed bid
            $table->decimal('amount_as_calculated', 15, 2)->nullable(); // After arithmetic correction
            $table->text('arithmetic_correction')->nullable(); // Explain if calculated != as_read
            $table->unsignedSmallInteger('rank')->nullable(); // Auto-computed ranking
            $table->timestamps();

            $table->unique(['bid_opening_id', 'vendor_id']);
        });

        // Bidder attendance tracking
        Schema::create('bid_opening_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bid_opening_id')->constrained('bid_openings')->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained('vendors');
            $table->boolean('present')->default(false);
            $table->timestamps();

            $table->unique(['bid_opening_id', 'vendor_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bid_opening_attendance');
        Schema::dropIfExists('bid_prices');
        Schema::dropIfExists('bid_eligibility_results');
        Schema::dropIfExists('bid_openings');
    }
};

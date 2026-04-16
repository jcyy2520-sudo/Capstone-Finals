<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Bid Evaluation records per evaluator per bidder (SRS Section 4.7.1)
     */
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bid_opening_id')->constrained('bid_openings');
            $table->foreignId('invitation_id')->constrained('invitations');
            $table->foreignId('evaluator_id')->constrained('users'); // BAC member or TWG evaluating
            $table->foreignId('vendor_id')->constrained('vendors');
            $table->json('technical_items')->nullable(); // [{item, result: pass/fail, remarks}]
            $table->decimal('calculated_price', 15, 2)->nullable();
            $table->text('arithmetic_correction_details')->nullable();
            $table->enum('recommendation', ['responsive', 'non_responsive'])->nullable();
            $table->text('overall_remarks')->nullable();
            $table->enum('status', ['draft', 'submitted', 'reviewed'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index(['bid_opening_id', 'evaluator_id']);
            $table->index(['bid_opening_id', 'vendor_id']);
        });

        // Consolidated evaluation results (aggregated from individual evaluations)
        Schema::create('evaluation_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bid_opening_id')->constrained('bid_openings');
            $table->foreignId('invitation_id')->constrained('invitations');
            $table->json('ranked_bidders')->nullable(); // [{rank, vendor_id, calculated_price}]
            $table->string('abstract_as_calculated_path')->nullable(); // Generated PDF path
            $table->string('evaluation_report_path')->nullable(); // Generated PDF path
            $table->enum('status', [
                'in_progress',
                'pending_chairperson_review',
                'approved',
                'failure_of_bidding',
            ])->default('in_progress');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->unique('bid_opening_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluation_summaries');
        Schema::dropIfExists('evaluations');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Invitations cover both ITB (Competitive Bidding) and RFQ (SVP) — SRS Section 4.4
     */
    public function up(): void
    {
        // Main invitation/advertisement record
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique(); // ITB-[YEAR]-[SEQ] or RFQ-[YEAR]-[SEQ]
            $table->foreignId('purchase_requisition_id')->constrained('purchase_requisitions');
            $table->enum('type', ['itb', 'rfq', 'limited_source', 'direct']); // ITB for Competitive Bidding, RFQ for SVP
            $table->string('project_title');
            $table->string('procuring_entity')->nullable(); // Auto-filled from config
            $table->decimal('abc', 15, 2); // Approved Budget for the Contract
            $table->string('fund_source');
            $table->string('procurement_mode');
            $table->decimal('bid_document_cost', 10, 2)->nullable(); // Per RA 12009 IRR schedule
            $table->date('eligibility_check_date')->nullable(); // ITB only
            $table->date('pre_bid_conference_date')->nullable(); // Required if ABC >= ₱1M
            $table->dateTime('submission_deadline');
            $table->dateTime('opening_date');
            $table->string('opening_venue')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->string('philgeps_reference')->nullable(); // Entered after PhilGEPS posting
            $table->text('additional_requirements')->nullable();
            $table->text('special_conditions')->nullable();
            $table->text('technical_specifications')->nullable();
            $table->string('delivery_location')->nullable(); // RFQ
            $table->string('delivery_schedule')->nullable(); // RFQ
            $table->enum('payment_terms', ['30_days', '60_days', 'upon_delivery'])->nullable();
            $table->enum('status', [
                'draft',
                'pending_chairperson_approval',
                'approved',
                'posted',
                'submission_open',
                'submission_closed',
                'opening_completed',
                'cancelled',
            ])->default('draft');
            $table->dateTime('posted_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('type');
        });

        // RFQ vendor invitations (which vendors were sent the RFQ)
        Schema::create('rfq_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitation_id')->constrained('invitations')->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained('vendors');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->enum('status', ['pending', 'sent', 'viewed', 'submitted', 'no_response'])->default('pending');
            $table->timestamps();

            $table->unique(['invitation_id', 'vendor_id']);
        });

        // Vendor bid/quotation submissions
        Schema::create('bid_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitation_id')->constrained('invitations');
            $table->foreignId('vendor_id')->constrained('vendors');
            $table->decimal('bid_amount', 15, 2)->nullable(); // For RFQ/SVP quotation
            $table->text('remarks')->nullable();
            $table->json('documents')->nullable(); // Array of uploaded document references
            $table->enum('status', ['submitted', 'under_review', 'accepted', 'rejected'])->default('submitted');
            $table->timestamps();

            $table->unique(['invitation_id', 'vendor_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bid_submissions');
        Schema::dropIfExists('rfq_invitations');
        Schema::dropIfExists('invitations');
    }
};

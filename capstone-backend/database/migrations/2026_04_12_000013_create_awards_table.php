<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Award processing — NOA, NTP (SRS Section 4.8.1)
     */
    public function up(): void
    {
        Schema::create('awards', function (Blueprint $table) {
            $table->id();
            $table->string('noa_reference')->unique(); // NOA-[YEAR]-[SEQ]
            $table->foreignId('invitation_id')->constrained('invitations');
            $table->foreignId('bid_opening_id')->constrained('bid_openings');
            $table->foreignId('vendor_id')->constrained('vendors'); // Winning bidder (LCRB)
            $table->decimal('contract_amount', 15, 2);
            $table->decimal('performance_security_amount', 15, 2)->nullable(); // 2-10% of contract
            $table->date('performance_security_deadline')->nullable(); // 10 days from NOA receipt
            $table->date('contract_signing_deadline')->nullable(); // 10 days from NOA receipt
            $table->text('special_conditions')->nullable();
            $table->string('noa_document_path')->nullable(); // Generated NOA PDF
            $table->string('noa_document_hash', 64)->nullable(); // SHA-256
            $table->string('ntp_reference')->nullable(); // NTP-[YEAR]-[SEQ]
            $table->string('ntp_document_path')->nullable();
            $table->string('ntp_document_hash', 64)->nullable();
            $table->date('ntp_date')->nullable(); // Day 1 of contract implementation
            $table->enum('status', [
                'pending_hope_approval',
                'hope_approved',
                'noa_issued',
                'noa_acknowledged',
                'ntp_issued',
                'cancelled',
                're_award',
            ])->default('pending_hope_approval');
            $table->foreignId('hope_signed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('hope_signed_at')->nullable();
            $table->timestamp('noa_issued_at')->nullable();
            $table->timestamp('noa_acknowledged_at')->nullable();
            $table->timestamp('ntp_issued_at')->nullable();
            $table->text('cancellation_grounds')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('awards');
    }
};

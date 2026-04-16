<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Pre-screening records for bidder document review (SRS Section 4.5.1)
     */
    public function up(): void
    {
        Schema::create('prescreenings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitation_id')->constrained('invitations');
            $table->foreignId('vendor_id')->constrained('vendors');
            $table->json('document_results')->nullable(); // [{doc_type, status, remarks, verified_at}]
            $table->enum('overall_status', [
                'pending',
                'complete',
                'with_deficiencies',
                'incomplete',
            ])->default('pending');
            $table->text('internal_notes')->nullable(); // BAC-only notes, not visible to vendor
            $table->foreignId('prescreened_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('prescreened_at')->nullable();
            $table->timestamps();

            $table->unique(['invitation_id', 'vendor_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prescreenings');
    }
};

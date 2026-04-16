<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vendor_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->enum('doc_type', [
                'dti_sec_cda',
                'mayors_permit',
                'tax_clearance',
                'philgeps_certificate',
                'audited_financial_statements',
                'pcab_license',
                'ongoing_contracts',
                'slcc',
                'bid_security',
                'other',
            ]);
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_hash', 64); // SHA-256 hash at upload time
            $table->bigInteger('file_size'); // bytes
            $table->string('mime_type', 100);
            $table->date('expiry_date')->nullable();
            $table->enum('status', [
                'pending', 'complete', 'incomplete', 'expired', 'defective',
            ])->default('pending');
            $table->text('remarks')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['vendor_id', 'doc_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_documents');
    }
};

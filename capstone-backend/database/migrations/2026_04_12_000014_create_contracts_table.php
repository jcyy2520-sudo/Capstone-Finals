<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Contract Management (SRS Section 4.9)
     */
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->string('contract_reference')->unique(); // CON-[YEAR]-[SEQ]
            $table->foreignId('award_id')->constrained('awards');
            $table->foreignId('vendor_id')->constrained('vendors');
            $table->foreignId('purchase_requisition_id')->constrained('purchase_requisitions');
            $table->date('ntp_date'); // Day 1 of implementation
            $table->unsignedInteger('duration_days');
            $table->date('end_date');
            $table->decimal('contract_amount', 15, 2);
            $table->string('contract_document_path')->nullable();
            $table->string('contract_document_hash', 64)->nullable(); // SHA-256
            $table->json('milestones')->nullable(); // [{name, due_date, completed_at}]
            $table->decimal('progress_percentage', 5, 2)->default(0);
            $table->enum('status', [
                'active',
                'suspended',
                'completed',
                'terminated_for_cause',
                'terminated_for_convenience',
                'for_renewal',
            ])->default('active');
            $table->timestamps();
        });

        // Contract amendments
        Schema::create('contract_amendments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained('contracts')->cascadeOnDelete();
            $table->enum('type', ['scope_change', 'cost_change', 'duration_change', 'other']);
            $table->text('description');
            $table->text('justification');
            $table->decimal('original_value', 15, 2)->nullable();
            $table->decimal('amended_value', 15, 2)->nullable();
            $table->enum('status', ['pending_bac_review', 'pending_hope_approval', 'approved', 'rejected'])->default('pending_bac_review');
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        // Contract extensions
        Schema::create('contract_extensions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained('contracts')->cascadeOnDelete();
            $table->unsignedInteger('additional_days');
            $table->date('new_end_date');
            $table->text('justification');
            $table->enum('grounds', ['force_majeure', 'government_delay', 'scope_change', 'other']);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        // Contract suspensions
        Schema::create('contract_suspensions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained('contracts')->cascadeOnDelete();
            $table->text('reason');
            $table->date('suspension_date');
            $table->date('resumption_date')->nullable();
            $table->unsignedInteger('suspension_days')->nullable();
            $table->foreignId('issued_by')->constrained('users'); // HOPE
            $table->timestamps();
        });

        // Inspection and Acceptance Reports
        Schema::create('inspection_acceptance_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained('contracts');
            $table->json('inspection_items')->nullable(); // [{item, qty, status, remarks}]
            $table->foreignId('inspected_by')->constrained('users');
            $table->foreignId('accepted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['pending_inspection', 'inspected', 'accepted', 'rejected'])->default('pending_inspection');
            $table->text('inspection_remarks')->nullable();
            $table->timestamp('inspected_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
        });

        // Invoices
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained('contracts');
            $table->foreignId('iar_id')->nullable()->constrained('inspection_acceptance_reports')->nullOnDelete();
            $table->foreignId('vendor_id')->constrained('vendors');
            $table->string('invoice_number')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('document_path')->nullable();
            $table->enum('status', [
                'submitted',
                'pending_validation',
                'validated',
                'certified_for_payment',
                'paid',
                'rejected',
            ])->default('submitted');
            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('inspection_acceptance_reports');
        Schema::dropIfExists('contract_suspensions');
        Schema::dropIfExists('contract_extensions');
        Schema::dropIfExists('contract_amendments');
        Schema::dropIfExists('contracts');
    }
};

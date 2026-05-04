<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Purchase Requisition (SRS Section 4.3.1)
     */
    public function up(): void
    {
        Schema::create('purchase_requisitions', function (Blueprint $table) {
            $table->id();
            $table->string('pr_reference')->unique(); // PR-[YEAR]-[DEPT]-[SEQ]
            $table->foreignId('app_entry_id')->constrained('app_entries');
            $table->foreignId('department_id')->constrained('departments');
            $table->foreignId('requester_id')->constrained('users');
            $table->text('purpose');
            $table->date('date_required');
            $table->enum('urgency_level', ['routine', 'urgent', 'emergency'])->default('routine');
            $table->text('emergency_justification')->nullable(); // Required if urgency = emergency
            $table->decimal('total_value', 15, 2)->default(0); // Auto-computed from line items
            $table->string('technical_specs_path')->nullable(); // Attached file
            $table->enum('status', [
                'draft',
                'pending_dh_endorsement',
                'pending_budget_certification',
                'pending_secretariat_review',
                'pending_mode_confirmation',
                'mode_confirmed',
                'accepted',
                'returned',
                'cancelled',
            ])->default('draft');
            $table->string('procurement_mode')->nullable(); // Assigned by Secretariat upon acceptance
            $table->text('return_remarks')->nullable();
            $table->foreignId('endorsed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('endorsed_at')->nullable();
            $table->foreignId('budget_certified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('budget_certified_at')->nullable();
            $table->string('fund_source')->nullable();
            $table->string('account_code', 30)->nullable();
            $table->foreignId('accepted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index(['department_id', 'status']);
        });

        // PR Line Items (normalized — one row per item)
        Schema::create('pr_line_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_requisition_id')->constrained('purchase_requisitions')->cascadeOnDelete();
            $table->text('item_description');
            $table->string('unit_of_measure', 50); // piece, box, ream, lot
            $table->unsignedInteger('quantity');
            $table->decimal('estimated_unit_cost', 15, 2);
            $table->decimal('estimated_total_cost', 15, 2); // qty × unit_cost
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pr_line_items');
        Schema::dropIfExists('purchase_requisitions');
    }
};

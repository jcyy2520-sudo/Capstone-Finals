<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * APP Entry = Annual Procurement Plan project line item (SRS Section 4.2.1)
     */
    public function up(): void
    {
        Schema::create('app_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->string('project_title', 300);
            $table->text('description');
            $table->enum('category', ['goods', 'services', 'infrastructure_works', 'consulting_services']);
            $table->enum('mode', [
                'competitive_bidding',
                'limited_source_bidding',
                'direct_contracting',
                'repeat_order',
                'shopping',
                'negotiated_procurement',
                'small_value_procurement',
                'lease_of_real_property',
                'community_participation',
                'agency_to_agency',
                'scientific_technological',
            ]);
            $table->decimal('abc', 15, 2); // Approved Budget for the Contract
            $table->string('unit_of_measurement')->nullable(); // Required for Goods
            $table->unsignedInteger('quantity')->nullable(); // Required for Goods
            $table->string('fund_source'); // General Fund, SEF, Trust Fund, etc.
            $table->string('account_code', 30); // Government Chart of Accounts: 000-000-000
            $table->string('implementing_unit'); // Requesting department/office
            $table->enum('target_start_quarter', ['Q1', 'Q2', 'Q3', 'Q4']);
            $table->enum('target_completion_quarter', ['Q1', 'Q2', 'Q3', 'Q4']);
            $table->unsignedSmallInteger('fiscal_year');
            $table->text('justification');
            $table->string('attachment_path')->nullable(); // Technical specs PDF/DOCX
            $table->enum('status', [
                'draft',
                'submitted',
                'pending_secretariat_consolidation',
                'pending_budget_certification',
                'pending_hope_approval',
                'approved',
                'returned',
                'cancelled',
            ])->default('draft');
            $table->boolean('is_supplemental')->default(false);
            $table->unsignedSmallInteger('version')->default(1);
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->text('return_remarks')->nullable();
            $table->timestamps();

            $table->index(['department_id', 'fiscal_year']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_entries');
    }
};

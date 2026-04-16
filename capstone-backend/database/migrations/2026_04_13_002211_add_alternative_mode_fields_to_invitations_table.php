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
        Schema::table('invitations', function (Blueprint $table) {
            $table->text('alternative_mode_justification')->after('procuring_entity')->nullable();
            $table->string('hope_approval_reference')->after('alternative_mode_justification')->nullable();
            $table->string('selected_supplier_name')->after('hope_approval_reference')->nullable();
            $table->text('selected_supplier_details')->after('selected_supplier_name')->nullable();
            
            // Add HOPE approval fields
            if (!Schema::hasColumn('invitations', 'hope_approved_at')) {
                $table->timestamp('hope_approved_at')->after('approved_at')->nullable();
            }
            if (!Schema::hasColumn('invitations', 'hope_approved_by')) {
                $table->foreignId('hope_approved_by')->after('hope_approved_at')->nullable()->constrained('users');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invitations', function (Blueprint $table) {
            //
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add budget certification columns to app_entries.
     */
    public function up(): void
    {
        Schema::table('app_entries', function (Blueprint $table) {
            $table->foreignId('budget_certified_by')->nullable()->after('approved_at')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('budget_certified_at')->nullable()->after('budget_certified_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('app_entries', function (Blueprint $table) {
            $table->dropForeign(['budget_certified_by']);
            $table->dropColumn(['budget_certified_by', 'budget_certified_at']);
        });
    }
};

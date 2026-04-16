<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_requisitions', function (Blueprint $table) {
            $table->string('recommended_mode')->nullable()->after('procurement_mode');
            $table->text('recommended_mode_justification')->nullable()->after('recommended_mode');
            $table->foreignId('mode_confirmed_by')->nullable()->after('recommended_mode_justification')->constrained('users')->onDelete('set null');
            $table->datetime('mode_confirmed_at')->nullable()->after('mode_confirmed_by');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_requisitions', function (Blueprint $table) {
            $table->dropForeign(['mode_confirmed_by']);
            $table->dropColumn(['recommended_mode', 'recommended_mode_justification', 'mode_confirmed_by', 'mode_confirmed_at']);
        });
    }
};

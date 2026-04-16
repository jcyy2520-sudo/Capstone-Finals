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
            $table->text('return_remarks')->nullable()->after('status');
            $table->foreignId('returned_by')->nullable()->constrained('users')->nullOnDelete()->after('return_remarks');
            $table->timestamp('returned_at')->nullable()->after('returned_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invitations', function (Blueprint $table) {
            $table->dropColumn(['return_remarks', 'returned_by', 'returned_at']);
        });
    }
};

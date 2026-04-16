<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bid_submissions', function (Blueprint $table) {
            $table->datetime('submitted_at')->nullable()->after('status');
            $table->boolean('is_late')->default(false)->after('submitted_at');
            $table->string('document_hash')->nullable()->after('is_late');
        });
    }

    public function down(): void
    {
        Schema::table('bid_submissions', function (Blueprint $table) {
            $table->dropColumn(['submitted_at', 'is_late', 'document_hash']);
        });
    }
};

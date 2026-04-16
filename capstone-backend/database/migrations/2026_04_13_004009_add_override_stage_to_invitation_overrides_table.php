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
        Schema::table('invitation_overrides', function (Blueprint $table) {
            $table->string('override_stage')->default('invitation_drafting')->after('invitation_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invitation_overrides', function (Blueprint $table) {
            $table->dropColumn('override_stage');
        });
    }
};

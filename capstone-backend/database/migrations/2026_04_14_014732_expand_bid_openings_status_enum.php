<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE bid_openings MODIFY COLUMN status ENUM(
            'scheduled','in_progress','completed','postponed','failed',
            'EVALUATION_APPROVED','POST_QUALIFICATION_ONGOING','POST_QUALIFICATION_PASSED',
            'POST_QUALIFICATION_FAILED','BAC_RESOLUTION_SIGNED','AWARD_RECOMMENDED',
            'NOA_ISSUED','NOA_ACKNOWLEDGED','AWARD_CANCELLED','CLOSED'
        ) NOT NULL DEFAULT 'scheduled'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE bid_openings MODIFY COLUMN status ENUM('scheduled','in_progress','completed','postponed','failed') NOT NULL DEFAULT 'scheduled'");
    }
};

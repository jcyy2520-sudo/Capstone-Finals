<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Align enum values with AwardController uppercase conventions.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE awards MODIFY COLUMN status ENUM(
            'DRAFT',
            'ISSUED',
            'ACKNOWLEDGED',
            'NTP_ISSUED',
            'CANCELLED',
            'RE_AWARD'
        ) DEFAULT 'DRAFT'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE awards MODIFY COLUMN status ENUM(
            'pending_hope_approval',
            'hope_approved',
            'noa_issued',
            'noa_acknowledged',
            'ntp_issued',
            'cancelled',
            're_award'
        ) DEFAULT 'pending_hope_approval'");
    }
};

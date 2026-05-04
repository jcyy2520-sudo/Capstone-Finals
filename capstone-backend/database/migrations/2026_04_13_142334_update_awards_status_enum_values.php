<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Align enum values with AwardController uppercase conventions.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::table('awards')->update([
                'status' => DB::raw("CASE status
                    WHEN 'pending_hope_approval' THEN 'DRAFT'
                    WHEN 'hope_approved' THEN 'DRAFT'
                    WHEN 'noa_issued' THEN 'ISSUED'
                    WHEN 'noa_acknowledged' THEN 'ACKNOWLEDGED'
                    WHEN 'ntp_issued' THEN 'NTP_ISSUED'
                    WHEN 'cancelled' THEN 'CANCELLED'
                    WHEN 're_award' THEN 'RE_AWARD'
                    ELSE status
                END"),
            ]);

            return;
        }

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
        if (DB::getDriverName() === 'sqlite') {
            DB::table('awards')->update([
                'status' => DB::raw("CASE status
                    WHEN 'DRAFT' THEN 'pending_hope_approval'
                    WHEN 'ISSUED' THEN 'noa_issued'
                    WHEN 'ACKNOWLEDGED' THEN 'noa_acknowledged'
                    WHEN 'NTP_ISSUED' THEN 'ntp_issued'
                    WHEN 'CANCELLED' THEN 'cancelled'
                    WHEN 'RE_AWARD' THEN 're_award'
                    ELSE status
                END"),
            ]);

            return;
        }

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

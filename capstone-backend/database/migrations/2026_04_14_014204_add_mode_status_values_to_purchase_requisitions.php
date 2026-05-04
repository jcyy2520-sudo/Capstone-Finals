<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE purchase_requisitions MODIFY COLUMN status ENUM('draft','pending_dh_endorsement','pending_budget_certification','pending_secretariat_review','pending_mode_confirmation','mode_confirmed','accepted','returned','cancelled') NOT NULL DEFAULT 'draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE purchase_requisitions MODIFY COLUMN status ENUM('draft','pending_dh_endorsement','pending_budget_certification','pending_secretariat_review','accepted','returned','cancelled') NOT NULL DEFAULT 'draft'");
    }
};

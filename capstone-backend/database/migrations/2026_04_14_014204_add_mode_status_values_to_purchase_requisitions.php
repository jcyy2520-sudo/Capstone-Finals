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
        DB::statement("ALTER TABLE purchase_requisitions MODIFY COLUMN status ENUM('draft','pending_dh_endorsement','pending_budget_certification','pending_secretariat_review','pending_mode_confirmation','mode_confirmed','accepted','returned','cancelled') NOT NULL DEFAULT 'draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE purchase_requisitions MODIFY COLUMN status ENUM('draft','pending_dh_endorsement','pending_budget_certification','pending_secretariat_review','accepted','returned','cancelled') NOT NULL DEFAULT 'draft'");
    }
};

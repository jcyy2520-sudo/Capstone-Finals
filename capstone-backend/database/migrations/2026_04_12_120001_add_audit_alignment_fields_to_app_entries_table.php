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
        Schema::table('app_entries', function (Blueprint $table) {
            $table->string('mfo_code', 50)->nullable()->after('description');
            $table->string('mfo_name_snapshot')->nullable()->after('mfo_code');
            $table->string('pap_code', 80)->nullable()->after('mfo_name_snapshot');
            $table->string('uacs_object_code', 30)->nullable()->after('pap_code');
            $table->string('approved_budget_reference', 120)->nullable()->after('uacs_object_code');
            $table->string('coa_trace_tag', 150)->nullable()->after('approved_budget_reference');

            $table->index('mfo_code');
            $table->index('pap_code');
            $table->index('uacs_object_code');
            $table->index('approved_budget_reference');
            $table->index('coa_trace_tag');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('app_entries', function (Blueprint $table) {
            $table->dropIndex(['mfo_code']);
            $table->dropIndex(['pap_code']);
            $table->dropIndex(['uacs_object_code']);
            $table->dropIndex(['approved_budget_reference']);
            $table->dropIndex(['coa_trace_tag']);

            $table->dropColumn([
                'mfo_code',
                'mfo_name_snapshot',
                'pap_code',
                'uacs_object_code',
                'approved_budget_reference',
                'coa_trace_tag',
            ]);
        });
    }
};

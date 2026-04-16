<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Extends the default Laravel users table with ProcureSeal-specific fields.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('id')->constrained('roles')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->after('role_id')->constrained('departments')->nullOnDelete();
            $table->string('designation')->nullable()->after('name'); // Job title
            $table->enum('status', ['active', 'locked', 'suspended', 'inactive'])->default('active')->after('password');
            $table->boolean('two_factor_enabled')->default(false)->after('status');
            $table->string('two_factor_secret')->nullable()->after('two_factor_enabled');
            $table->unsignedTinyInteger('failed_login_attempts')->default(0)->after('two_factor_secret');
            $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
            $table->timestamp('last_login_at')->nullable()->after('locked_until');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
            $table->string('phone', 20)->nullable()->after('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropForeign(['department_id']);
            $table->dropColumn([
                'role_id', 'department_id', 'designation', 'status',
                'two_factor_enabled', 'two_factor_secret',
                'failed_login_attempts', 'locked_until',
                'last_login_at', 'last_login_ip', 'phone',
            ]);
        });
    }
};

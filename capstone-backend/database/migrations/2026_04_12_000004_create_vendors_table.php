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
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // Linked user account
            $table->string('business_name')->unique();
            $table->enum('business_type', [
                'sole_proprietorship', 'partnership', 'corporation',
                'joint_venture', 'foreign_company',
            ]);
            $table->string('dti_sec_cda_number'); // DTI/SEC/CDA Registration Number
            $table->string('philgeps_number', 10)->unique(); // 7-digit PhilGEPS ref
            $table->string('tin', 20); // Tax Identification Number (000-000-000-000)
            $table->text('address'); // Registered business address
            $table->string('contact_person');
            $table->string('contact_email');
            $table->string('contact_mobile', 20); // 09XX-XXX-XXXX
            $table->json('procurement_categories'); // ['Goods', 'Services', 'Works', etc.]
            $table->enum('status', [
                'pending_email_verification',
                'pending_secretariat_review',
                'approved',
                'suspended',
                'blacklisted',
                'rejected',
            ])->default('pending_email_verification');
            $table->boolean('is_blacklisted')->default(false);
            $table->text('blacklist_details')->nullable();
            $table->timestamp('blacklist_checked_at')->nullable();
            $table->string('email_verification_token')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('tin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};

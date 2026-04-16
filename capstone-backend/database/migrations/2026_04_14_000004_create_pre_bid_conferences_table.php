<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pre_bid_conferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitation_id')->constrained()->onDelete('cascade');
            $table->datetime('conference_date');
            $table->string('venue')->nullable();
            $table->json('attendees')->nullable();
            $table->text('minutes')->nullable();
            $table->json('queries_raised')->nullable();
            $table->json('supplemental_bid_bulletins')->nullable();
            $table->string('status')->default('scheduled');
            $table->foreignId('conducted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pre_bid_conferences');
    }
};

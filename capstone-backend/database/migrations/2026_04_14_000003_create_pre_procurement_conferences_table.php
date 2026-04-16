<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pre_procurement_conferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_requisition_id')->constrained()->onDelete('cascade');
            $table->foreignId('invitation_id')->nullable()->constrained()->onDelete('set null');
            $table->datetime('conference_date');
            $table->string('venue')->nullable();
            $table->text('agenda')->nullable();
            $table->json('attendees')->nullable();
            $table->boolean('abc_validated')->default(false);
            $table->boolean('specs_validated')->default(false);
            $table->boolean('bidding_docs_validated')->default(false);
            $table->text('minutes')->nullable();
            $table->string('minutes_document_path')->nullable();
            $table->string('outcome')->default('draft');
            $table->text('remarks')->nullable();
            $table->foreignId('conducted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('status')->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pre_procurement_conferences');
    }
};

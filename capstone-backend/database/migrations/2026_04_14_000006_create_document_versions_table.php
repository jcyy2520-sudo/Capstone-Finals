<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_versions', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->string('document_type');
            $table->integer('version')->default(1);
            $table->string('file_path');
            $table->string('file_hash', 64);
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('mime_type')->nullable();
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->text('remarks')->nullable();
            $table->boolean('is_current')->default(true);
            $table->timestamps();

            $table->index(['entity_type', 'entity_id', 'document_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_versions');
    }
};

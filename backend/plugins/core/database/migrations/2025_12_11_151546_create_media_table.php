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
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('path');
            $table->string('type');
            $table->string('alt')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->unsignedBigInteger('size');
            $table->string('mime_type');
            $table->string('extension')->nullable();
            $table->string('hash')->nullable();
            $table->string('disk')->default('public');
            $table->text('absolute_url');
            $table->timestamps();

            // Indexes for better query performance
            $table->index('parent_id');
            $table->index('type');
            $table->index('hash');
            $table->index('disk');

            // Foreign key constraint (optional - uncomment if needed)
            // $table->foreign('parent_id')->references('id')->on('media')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
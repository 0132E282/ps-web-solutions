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
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->json('title');
            $table->json('content');
            $table->json('description')->nullable();
            $table->json('position')->nullable();
            $table->enum('status', ['published', 'draft', 'archived'])->nullable()->default('published');
            $table->json('slug');
            $table->json('image')->nullable();
            $table->json('published_at')->nullable();
            $table->json('attribute_data')->nullable();
            $table->timestamps();
        });

        Schema::create('post_ref_related_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('posts')->onDelete('cascade');
            $table->foreignId('related_post_id')->constrained('posts')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['post_id', 'related_post_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_ref_related_posts');
        Schema::dropIfExists('posts');
    }
};

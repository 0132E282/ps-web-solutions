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
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('status', ['published', 'draft'])->default('published');
            $table->string('type');
            $table->integer('level')->default(1);
            $table->json('slug')->nullable();
            $table->json('attribute_data')->nullable();
            $table->timestamps();
        });


        Schema::create('taggables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tag_id')->constrained('tags')->onDelete('cascade');
            $table->unsignedBigInteger('taggable_id');
            $table->string('taggable_type');
            $table->timestamps();

            $table->index(['taggable_id', 'taggable_type']);
            $table->unique(['tag_id', 'taggable_id', 'taggable_type'], 'tag_taggable_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taggables');
        Schema::dropIfExists('tags');
    }
};

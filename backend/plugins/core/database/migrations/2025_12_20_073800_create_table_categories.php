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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->onDelete('cascade');
            $table->string('image')->nullable();
            $table->enum('status', ['published', 'draft'])->default('published');
            $table->string('type');
            $table->json('slug')->nullable();
            $table->json('content')->nullable();
            $table->json('attribute_data')->nullable();
            $table->integer('level')->default(1);
            $table->timestamps();
        });


        Schema::create('categorizables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->unsignedBigInteger('categorizable_id');
            $table->string('categorizable_type');
            $table->timestamps();

            $table->index(['categorizable_id', 'categorizable_type']);
            $table->unique(['category_id', 'categorizable_id', 'categorizable_type'], 'category_categorizable_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categorizables');
        Schema::dropIfExists('categories');
    }
};

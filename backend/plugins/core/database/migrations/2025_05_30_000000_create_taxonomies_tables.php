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
        Schema::create('taxonomies', function (Blueprint $table) {
            $table->id();
            $table->string('type')->index();
            $table->json('name');
            $table->json('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable()->index();
            $table->json('property')->nullable();
            $table->string('status')->default('published')->index();
            $table->integer('sort_order')->default(0)->index();
            
            // Nested Set Model columns
            $table->integer('lft')->nullable()->index();
            $table->integer('rgt')->nullable()->index();
            $table->integer('depth')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            // Foreign key
            $table->foreign('parent_id')
                  ->references('id')
                  ->on('taxonomies')
                  ->onDelete('cascade');
        });

        Schema::create('model_has_taxonomies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('taxonomy_id');
            $table->morphs('model');
            $table->timestamps();

            $table->foreign('taxonomy_id')
                  ->references('id')
                  ->on('taxonomies')
                  ->onDelete('cascade');

            $table->unique(['taxonomy_id', 'model_id', 'model_type'], 'model_has_taxonomies_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('model_has_taxonomies');
        Schema::dropIfExists('taxonomies');
    }
};

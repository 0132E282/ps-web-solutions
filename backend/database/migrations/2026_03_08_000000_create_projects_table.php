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
    Schema::create('projects', function (Blueprint $table) {
      $table->id();
      $table->string('name');
      $table->string('slug')->unique();
      $table->text('description')->nullable();
      $table->longText('content')->nullable();
      $table->string('image')->nullable();
      $table->enum('status', ['published', 'draft'])->default('published');
      $table->timestamps();
    });

    Schema::create('project_categories', function (Blueprint $table) {
      $table->id();
      $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
      $table->foreignId('category_id')->constrained('taxonomies')->onDelete('cascade');
      $table->timestamps();

      $table->unique(['project_id', 'category_id']);
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('project_categories');
    Schema::dropIfExists('projects');
  }
};

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
        Schema::create('seos', function (Blueprint $table) {
            $table->id();
            
            // Polymorphic relationship fields
            $table->morphs('seoable');
            
            // Basic SEO fields
            $table->json('title')->nullable();
            $table->json('slug')->nullable();
            $table->json('description')->nullable();
            $table->json('keywords')->nullable();
            $table->json('image')->nullable();
            $table->json('canonical_url')->nullable();
            
            // Open Graph fields
            $table->json('og_title')->nullable();
            $table->json('og_description')->nullable();
            $table->json('og_image')->nullable();
            $table->string('og_type')->nullable();
            $table->json('og_url')->nullable();
            $table->string('og_site_name')->nullable();
            
            // Twitter Card fields
            $table->string('twitter_card')->nullable();
            $table->json('twitter_title')->nullable();
            $table->json('twitter_description')->nullable();
            $table->json('twitter_image')->nullable();
            $table->string('twitter_site')->nullable();
            $table->string('twitter_creator')->nullable();
            
            // Robots & Indexing
            $table->string('robots')->nullable();
            $table->json('meta_robots_advanced')->nullable();
            
            // Schema markup (JSON-LD)
            $table->json('schema_markup')->nullable();
            
            // Focus keyword for SEO analysis
            $table->json('focus_keyword')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seos');
    }
};
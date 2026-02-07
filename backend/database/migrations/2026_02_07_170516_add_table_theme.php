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
        Schema::create("themes", function (Blueprint $table) {
            $table->id();
            $table->string("name");
            $table->string("slug")->unique();
            $table->text("description")->nullable();
            $table->decimal("price", 15, 2)->default(0);
            $table->integer("stock")->default(0);
            $table->decimal("compare_at_price", 15, 2)->default(0);
            $table->string("image")->nullable();
            $table->json("images")->nullable();
            $table->string("link_download")->nullable();
            $table->string("status")->default("draft");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("themes");
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('path')->nullable();
            $table->string('type')->default('file'); // file | folder
            $table->string('alt')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->bigInteger('size')->nullable();
            $table->string('mime_type')->nullable();
            $table->string('extension')->nullable();
            $table->string('hash')->nullable();
            $table->string('disk')->default('public');
            $table->string('absolute_url')->nullable();
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('files')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};

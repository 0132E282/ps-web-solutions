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
        Schema::create('product_variations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            $table->string('name')->nullable();
            $table->string('sku')->nullable()->index();
            $table->string('barcode')->nullable()->index();

            // Pricing
            $table->decimal('price', 15, 2)->default(0);
            $table->decimal('compare_at_price', 15, 2)->nullable();
            $table->decimal('cost', 15, 2)->nullable();

            // Pricing from Component (Aliases or extra fields)
            $table->decimal('price_retail', 15, 2)->default(0);
            $table->decimal('price_wholesale', 15, 2)->default(0);
            $table->decimal('price_agency_c3', 15, 2)->default(0);
            $table->decimal('price_staff', 15, 2)->default(0);
            $table->decimal('price_import', 15, 2)->default(0);

            // Taxes
            $table->decimal('vat', 5, 2)->nullable();
            $table->decimal('vat_price', 15, 2)->nullable();
            $table->boolean('apply_tax')->default(false);

            // Inventory
            $table->integer('stock_on_hand')->default(0);
            $table->integer('stock_available')->default(0);
            $table->boolean('allow_sale')->default(true);

            // Attributes
            $table->string('attribute_name')->nullable();
            $table->string('attribute_value')->nullable();

            // Physical properties
            $table->decimal('weight', 10, 2)->default(0);
            $table->string('unit')->nullable();
            $table->string('image')->nullable();

            $table->timestamps();
        });

        // Pivot table for variations and options
        Schema::create('product_option_variation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variation_id')->constrained('product_variations')->cascadeOnDelete();
            $table->foreignId('taxonomy_id')->constrained('taxonomies')->cascadeOnDelete(); // Product options are BaseTerms (taxonomies)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_option_variation');
        Schema::dropIfExists('product_variations');
    }
};

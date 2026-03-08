<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    $tableNames = config('taxonomy.table_names');
    $morphType = config('taxonomy.morph_type', 'uuid');

    // # GOOD: If table exists from vendor migration, ensure column exists
    if (Schema::hasTable($tableNames['taxonomies'])) {
      Schema::table($tableNames['taxonomies'], function (Blueprint $table) {
        if (!Schema::hasColumn($table->getTable(), 'status')) {
          $table->string('status')->index()->default('published')->after('type');
        }
        if (!Schema::hasColumn($table->getTable(), 'deleted_at')) {
          $table->softDeletes();
        }
      });
    } else {
      Schema::create($tableNames['taxonomies'], function (Blueprint $table) {
        $table->id();
        $table->json('name');
        $table->json('slug')->unique();
        $table->json('type')->index();
        $table->string('status')->index()->default('published');
        $table->json('description')->nullable();
        $table->foreignId('parent_id')->nullable()->constrained('taxonomies');
        $table->integer('sort_order')->default(0);
        $table->json('property')->nullable();
        $table->timestamps();
        $table->softDeletes();
      });
    }

    if (!Schema::hasTable($tableNames['taxonomables'])) {
      Schema::create($tableNames['taxonomables'], function (Blueprint $table) use ($morphType) {
        $table->id();
        $table->foreignId('taxonomy_id')->constrained()->cascadeOnDelete();

        $name = 'taxonomable';
        switch ($morphType) {
          case 'uuid':
            $table->uuidMorphs($name);
            break;
          case 'ulid':
            $table->ulidMorphs($name);
            break;
          default:
            $table->morphs($name);
            break;
        }
        $table->timestamps();
      });
    }
  }

  public function down(): void
  {
    $tableNames = config('taxonomy.table_names');

    Schema::dropIfExists($tableNames['taxonomables']);
    Schema::dropIfExists($tableNames['taxonomies']);
  }
};

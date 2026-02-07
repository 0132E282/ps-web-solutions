<?php

namespace PS0132E282\Core\Providers;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use PS0132E282\Core\Traits\HasCrudAction;
use PS0132E282\Core\Services\ItemLoader;
use Spatie\Permission\Models\Permission;

class MacroServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->registerRouteMacros();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerQueryMacros();
    }

    protected function registerRouteMacros(): void
    {
        Route::macro('admin', function (array $middleware = []) {
            $prefix = config('admin.prefix', 'admin');
            $defaultMiddleware = ['web', 'auth', 'verified'];

            return Route::middleware(array_merge($defaultMiddleware, $middleware))->prefix($prefix);
        });

        Route::macro('module', function (string $name, string $controller) {
            $hasSoftDeletes = false;
            $hasImport = false;
            $hasExport = false;

            try {
                if (class_exists($controller)) {
                    $reflection = new \ReflectionClass($controller);
                    $instance = $reflection->newInstanceWithoutConstructor();

                    // Extract model class from controller
                    $modelClass = null;
                    if ($reflection->hasProperty('model')) {
                        $property = $reflection->getProperty('model');
                        $property->setAccessible(true);
                        $modelClass = $property->getValue($instance);
                    }

                    if ($modelClass && class_exists($modelClass)) {
                        $traits = class_uses_recursive($modelClass);
                        $hasSoftDeletes = in_array(\Illuminate\Database\Eloquent\SoftDeletes::class, $traits);

                        $hasImport = in_array(\PS0132E282\Core\Traits\CanImport::class, $traits);
                        $hasExport = in_array(\PS0132E282\Core\Traits\CanExport::class, $traits);
                    }

                    // Fallback to controller method check
                    if (!$hasImport) $hasImport = $reflection->hasMethod('import');
                    if (!$hasExport) $hasExport = $reflection->hasMethod('export');
                }
            } catch (\Exception $e) {
                // Fallback to default behavior if reflection fails
            }

            Route::prefix("{$name}")->name("admin.{$name}.")->controller($controller)->group(function () use ($name, $controller, $hasSoftDeletes, $hasImport, $hasExport) {
                Route::get("/", 'index')->name("index");
                Route::get("/create", 'form')->name("create");
                Route::post("/create", 'store')->name("store");
                Route::get("/{id}", 'form')->name("show");
                Route::put("/{id}", 'edit')->name("update");
                Route::patch("/{id}", 'update')->name("update");
                Route::delete("/{id}", 'destroy')->name("destroy");
                Route::post("/{id}/duplicate", 'duplicate')->name("duplicate");

                if ($hasSoftDeletes) {
                    Route::get("/trash", 'trash')->name("trash");
                    Route::post("/{id}/restore", 'restore')->name("restore");
                    Route::delete("/{id}/force-delete", 'forceDelete')->name("force-delete");
                }

                if ($hasExport) {
                    Route::get("/export", 'export')->name("export");
                }

                if ($hasImport) {
                    Route::post("/import", 'import')->name("import");
                    Route::get("/import/template", 'importTemplate')->name("import-template");
                }
            });
        });
    }

    protected function registerQueryMacros(): void
    {
        Builder::macro('loadItems', function (?callable $applyFieldsCallback = null, array $options = []) {
            /** @var \Illuminate\Database\Eloquent\Builder $this */
            return ItemLoader::load($this, $applyFieldsCallback, $options);
        });
    }
}

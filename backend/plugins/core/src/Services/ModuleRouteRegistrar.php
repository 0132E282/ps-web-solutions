<?php

namespace PS0132E282\Core\Services;

use Illuminate\Support\Facades\Route;
use PS0132E282\Core\Providers\MacroServiceProvider;

/**
 * Class ModuleRouteRegistrar
 * Handles registration for standard CRUD modules.
 */
class ModuleRouteRegistrar
{
    protected array $options = [];

    protected array $middleware = [];

    public function __construct(
        protected string $name,
        protected string $controller,
        array $options = []
    ) {
        $this->options = $options;
    }

    /**
     * Add extra middleware to the module.
     *
     * @param  array|string  $middleware
     * @return $this
     */
    public function middleware($middleware): self
    {
        $this->middleware = array_unique(array_merge($this->middleware, (array) $middleware));

        return $this;
    }

    /**
     * Register the module routes.
     */
    public function register(): void
    {
        // 1. Analyze Metadata
        $metadata = $this->analyzeController();
        $modelClass = $this->options['model'] ?? $metadata['model'];

        $routeMw = function ($action) use ($modelClass) {
            return $this->resolveMiddleware($action, $modelClass);
        };

        // 2. Build Flags
        $hasSoftDeletes = $metadata['hasSoftDeletes'] ?? false;
        $hasImport = $metadata['hasImport'] ?? false;
        $hasExport = $metadata['hasExport'] ?? false;

        // 3. Register Routes
        Route::prefix($this->name)
            ->name("{$this->name}.")
            ->controller($this->controller)
            ->group(function () use ($hasSoftDeletes, $hasImport, $hasExport, $routeMw) {

                Route::get('/', 'index')->name('index')->middleware($routeMw('index'));
                Route::get('/create', 'form')->name('create')->middleware($routeMw('create'));
                Route::post('/create', 'store')->name('store')->middleware($routeMw('store'));
                Route::get('/{id}', 'form')->name('show')->middleware($routeMw('show'));
                Route::put('/{id}', 'edit')->name('update')->middleware($routeMw('edit'));
                Route::patch('/{id}', 'update')->name('update')->middleware($routeMw('update'));
                Route::delete('/{id}', 'destroy')->name('destroy')->middleware($routeMw('destroy'));
                Route::post('/{id}/duplicate', 'duplicate')->name('duplicate')->middleware($routeMw('duplicate'));

                if ($hasSoftDeletes) {
                    Route::get('/trash', 'trash')->name('trash')->middleware($routeMw('trash'));
                    Route::post('/{id}/restore', 'restore')->name('restore')->middleware($routeMw('restore'));
                    Route::delete('/{id}/force-delete', 'forceDelete')->name('force-delete')->middleware($routeMw('forceDelete'));
                }

                if ($hasExport) {
                    Route::get('/export', 'export')->name('export')->middleware($routeMw('export'));
                }

                if ($hasImport) {
                    Route::post('/import', 'import')->name('import')->middleware($routeMw('import'));
                    Route::get('/import/template', 'importTemplate')->name('import-template')->middleware($routeMw('import'));
                }
            });
    }

    /**
     * Analyze controller to extract metadata.
     */
    protected function analyzeController(): array
    {
        $metadata = [
            'model' => null,
            'hasSoftDeletes' => false,
            'hasImport' => false,
            'hasExport' => false,
        ];

        if (! class_exists($this->controller)) {
            return $metadata;
        }

        try {
            $reflection = new \ReflectionClass($this->controller);
            $instance = $reflection->newInstanceWithoutConstructor();

            // Extract Model from property
            if ($reflection->hasProperty('model')) {
                $property = $reflection->getProperty('model');
                $property->setAccessible(true);
                $metadata['model'] = $property->getValue($instance);
            }

            // Analyze Traits on Model
            if ($metadata['model'] && class_exists($metadata['model'])) {
                $traits = class_uses_recursive($metadata['model']);
                $metadata['hasSoftDeletes'] = in_array(\Illuminate\Database\Eloquent\SoftDeletes::class, $traits);
                $metadata['hasImport'] = in_array(\PS0132E282\Core\Traits\CanImport::class, $traits);
                $metadata['hasExport'] = in_array(\PS0132E282\Core\Traits\CanExport::class, $traits);
            }

            // Fallback: Check Controller Methods
            if (! $metadata['hasImport']) {
                $metadata['hasImport'] = $reflection->hasMethod('import');
            }
            if (! $metadata['hasExport']) {
                $metadata['hasExport'] = $reflection->hasMethod('export');
            }
        } catch (\Exception $e) {
            // Log fallback
        }

        return $metadata;
    }

    /**
     * Resolve middleware for a given action.
     */
    protected function resolveMiddleware(string $action, ?string $modelClass): array
    {
        $middlewares = [];

        // 1. Options/Registrar Middleware
        if (! empty($this->middleware)) {
            $middlewares = array_merge($middlewares, (array) $this->middleware);
        }
        if (isset($this->options['middleware'])) {
            $middlewares = array_merge($middlewares, (array) $this->options['middleware']);
        }

        // 2. Policy Check
        if (! empty($this->options['policy'])) {
            $policyMap = [
                'index' => 'viewAny',
                'create' => 'create',
                'store' => 'create',
                'show' => 'view',
                'edit' => 'update',
                'update' => 'update',
                'destroy' => 'delete',
                'trash' => 'delete',
                'restore' => 'restore',
                'forceDelete' => 'forceDelete',
                'import' => 'create',
                'export' => 'viewAny',
                'duplicate' => 'create',
            ];

            $ability = $policyMap[$action] ?? null;
            if ($ability && $modelClass) {
                $middlewares[] = "can:{$ability},{$modelClass}";
            }
        }

        // 3. Gate Check
        if (! empty($this->options['gate'])) {
            $gateName = is_string($this->options['gate']) ? $this->options['gate'] : $this->name;
            $gateMap = [
                'index' => 'index',
                'create' => 'create',
                'store' => 'create',
                'show' => 'show',
                'edit' => 'edit',
                'update' => 'edit',
                'destroy' => 'destroy',
                'trash' => 'trash',
                'restore' => 'restore',
                'forceDelete' => 'forceDelete',
                'import' => 'import',
                'export' => 'export',
                'duplicate' => 'duplicate',
            ];

            $suffix = $gateMap[$action] ?? $action;
            $middlewares[] = "can:{$gateName}.{$suffix}";
        }

        return array_unique($middlewares);
    }

    /**
     * Destructor to ensure registration if not called manually.
     */
    public function __destruct()
    {
        // In standard Laravel macros, we usually execute immediately.
        // But to support chaining, we might need a way to trigger it.
        // For now, MacroServiceProvider will call register() immediately after creation.
    }
}

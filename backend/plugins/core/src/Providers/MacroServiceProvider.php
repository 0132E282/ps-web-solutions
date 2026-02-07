<?php

namespace PS0132E282\Core\Providers;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use PS0132E282\Core\Services\ItemLoader;

// Keep this if it's still used elsewhere or for context
// Keep this if it's still used elsewhere or for context

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
        Route::macro('admin', function ($callback = null) {
            $registrar = new \PS0132E282\Core\Services\AdminRouteRegistrar;
            if ($callback) {
                $registrar->group($callback);
            }

            return $registrar;
        });

        Route::macro('module', function (string $name, string $controller, array $options = []) {
            $registrar = new \PS0132E282\Core\Services\ModuleRouteRegistrar($name, $controller, $options);
            $registrar->register();

            return $registrar;
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

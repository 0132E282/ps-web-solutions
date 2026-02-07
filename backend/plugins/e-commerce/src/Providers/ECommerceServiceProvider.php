<?php

namespace PS0132E282\ECommerce\Providers;

use Illuminate\Support\ServiceProvider;

class ECommerceServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Merge config
        $this->mergeConfigFrom(
            __DIR__ . '/../../config/e-commerce.php',
            'e-commerce'
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load routes
        $this->loadRoutesFrom(__DIR__ . '/../../routes/e-commerce.php');

        // Load migrations
        $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');

        // Publish config
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../../config/e-commerce.php' => config_path('e-commerce.php'),
            ], 'e-commerce-config');

            // Publish migrations
            $this->publishes([
                __DIR__ . '/../../database/migrations' => database_path('migrations'),
            ], 'e-commerce-migrations');
        }
    }
}

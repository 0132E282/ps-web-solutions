<?php

namespace PS0132E282\Core\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class LogViewerServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Publish log-viewer config
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../../config/log-viewer.php' => config_path('log-viewer.php'),
            ], 'log-viewer-config');
        }

        // Merge config
        $this->mergeConfigFrom(
            __DIR__.'/../../config/log-viewer.php',
            'log-viewer'
        );

        // Authorization Gate
        Gate::define('viewLogViewer', function ($user = null) {
            // Allow access if user is authenticated and has super-admin or admin role
            return $user
                && ($user->hasRole('super-admin') || $user->hasRole('admin'));
        });
    }
}

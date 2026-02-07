<?php

namespace PS0132E282\Cms\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use PS0132E282\Core\Traits\AutoReginPlugin;

class CmsServiceProvider extends ServiceProvider
{
    use AutoReginPlugin;

    public function register(): void
    {
        $this->registerConfigs();
    }

    public function boot(): void
    {
        $this->registerViews();
        $this->registerRoutes();
        $this->registerMigrations();

        $this->app->booted(function () {
            $schedule = $this->app->make(\Illuminate\Console\Scheduling\Schedule::class);
            $schedule->command('activitylog:clean')->daily();
        });
    }
}

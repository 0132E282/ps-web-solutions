<?php

namespace PS0132E282\Notifications\Providers;

use Illuminate\Support\ServiceProvider;
use PS0132E282\Core\Traits\AutoReginPlugin;

class NotificationServiceProvider extends ServiceProvider
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
    }
}

<?php

namespace PS0132E282\Core\Providers;

use Illuminate\Database\Migrations\Migrator;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use PS0132E282\Core\Base\PluginManager;
use PS0132E282\Core\Traits\AutoReginPlugin;
use PS0132E282\Core\Middleware\PermissionMiddleware;
use PS0132E282\Core\Middleware\RoleMiddleware;

class CoreServiceProvider extends ServiceProvider
{
    use AutoReginPlugin;

    public function register(): void
    {
        $this->registerConfigs();
        $this->registerHelpers();

        if (file_exists(__DIR__ . '/../../config/activitylog.php')) {
            $this->mergeConfigFrom(__DIR__ . '/../../config/activitylog.php', 'activitylog');
        }
        if (file_exists(__DIR__ . '/../../config/log-viewer.php')) {
            $this->mergeConfigFrom(__DIR__ . '/../../config/log-viewer.php', 'log-viewer');
        }
        if (file_exists(__DIR__ . '/../../config/admin.php')) {
            $this->mergeConfigFrom(__DIR__ . '/../../config/admin.php', 'core.admin');
        }
        if (file_exists(__DIR__ . '/../../config/plugins.php')) {
            $this->mergeConfigFrom(__DIR__ . '/../../config/plugins.php', 'core.plugins');
        }
    }

    public function boot(): void
    {
        $this->registerViews();
        $this->registerRoutes();
        $this->registerMigrations();
        $this->registerPluginMigrationPaths();
        $this->registerCommands();
        $this->registerMiddleware();
        $this->registerInertiaShares();
    }

    protected function registerPluginMigrationPaths(): void
    {
        $pluginPaths = PluginManager::getPluginMigrationPaths();

        if (!empty($pluginPaths)) {
            $this->app->afterResolving('migrator', function (Migrator $migrator) use ($pluginPaths) {
                foreach ($pluginPaths as $path) {
                    $migrator->path($path);
                }
            });
        }
    }

    protected function registerMiddleware(): void
    {
        $router = $this->app['router'];
        $router->aliasMiddleware('role', RoleMiddleware::class);
        $router->aliasMiddleware('permission', PermissionMiddleware::class);
        $router->aliasMiddleware('set.locale', \PS0132E282\Core\Middleware\SetLocale::class);
    }

    protected function registerInertiaShares(): void
    {
        Inertia::share('sidebar', fn() => $this->getSidebarData());
        Inertia::share('translations', fn() => $this->getTranslations());
        Inertia::share('locale', fn() => app()->getLocale());
        Inertia::share('locales', fn() => $this->getLocales());
        Inertia::share('auth', fn() => [
            'user' => auth()->user()
        ]);
        Inertia::share('ziggy', fn() => [
            ...(new \Tighten\Ziggy\Ziggy)->toArray(),
            'location' => request()->url(),
        ]);
    }

    protected function getLocales(): array
    {
        $langPath = public_path('lang');
        if (!is_dir($langPath)) {
            return [app()->getLocale()];
        }

        $locales = [];
        foreach (scandir($langPath) as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $filePath = "$langPath/$file";
            if (is_file($filePath) && pathinfo($file, PATHINFO_EXTENSION) === 'json') {
                $locale = pathinfo($file, PATHINFO_FILENAME);
                if (preg_match('/^[a-z]{2}(_[A-Z]{2})?$/', $locale)) {
                    $locales[] = $locale;
                }
            }
        }

        return !empty($locales) ? array_values($locales) : [app()->getLocale()];
    }

    protected function getTranslations(): array
    {
        $translations = [];
        foreach ($this->getLocales() as $locale) {
            $translations[$locale] = $this->loadJsonTranslations($locale);
        }
        return $translations;
    }

    protected function loadJsonTranslations(string $locale): array
    {
        $jsonPath = public_path("lang/{$locale}.json");
        if (!file_exists($jsonPath)) {
            return [];
        }

        try {
            $content = file_get_contents($jsonPath);
            $translations = $content ? json_decode($content, true) : null;
            return (is_array($translations) && json_last_error() === JSON_ERROR_NONE) ? $translations : [];
        } catch (\Exception $e) {
            return [];
        }
    }

    protected function getSidebarData(): array
    {
        $sidebarConfig = config('admin.sidebar') ?? config('sidebar') ?? [];
        $accountConfig = $sidebarConfig['account'] ?? [];

        // Process top items
        $topItems = $this->processSidebarItems($sidebarConfig['top'] ?? []);

        // If account.sidebar exists, add it to bottom of top items
        if (isset($accountConfig['sidebar'])) {
            $topItems[] = $this->processSidebarItem($accountConfig['sidebar']);
        }

        // Process account items for user dropdown
        // Support both direct array format and nested 'user' format
        $accountUserItems = [];
        if (isset($accountConfig['user']) && is_array($accountConfig['user'])) {
            // Nested format: account.user
            $accountUserItems = $this->processSidebarItems($accountConfig['user']);
        } elseif (is_array($accountConfig) && !isset($accountConfig['sidebar'])) {
            // Direct array format: account directly contains menu items
            $accountUserItems = $this->processSidebarItems($accountConfig);
        }

        return [
            'top' => $topItems,
            'bottom' => $this->processSidebarItems($sidebarConfig['bottom'] ?? []),
            'account' => $accountUserItems,
        ];
    }

    protected function processSidebarItem(array $item): array
    {
        if (isset($item['route'])) {
            $item['url'] = Route::has($item['route']) ? route($item['route']) : '#';
            if (empty($item['title'])) {
                $item['route_name'] = $item['route'];
            }
            unset($item['route']);
        }

        if (isset($item['children']) && is_array($item['children'])) {
            $item['children'] = $this->processSidebarItems($item['children']);
        }

        return $item;
    }

    protected function processSidebarItems(array $items): array
    {
        return array_map(function ($item) {
            if (isset($item['route'])) {
                if ($item['route'] === 'admin.notifications.index') {
                    $user = auth()->user();
                    $item['badge'] = ($user && \Illuminate\Support\Facades\Schema::hasTable('notifications'))
                        ? $user->unreadNotifications()->count()
                        : 0;
                }

                $item['url'] = Route::has($item['route']) ? route($item['route']) : '#';
                if (empty($item['title'])) {
                    $item['route_name'] = $item['route'];
                }
                unset($item['route']);
            }

            if (isset($item['children']) && is_array($item['children'])) {
                $item['children'] = $this->processSidebarItems($item['children']);
            }

            return $item;
        }, $items);
    }
}

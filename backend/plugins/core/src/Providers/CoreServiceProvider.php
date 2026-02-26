<?php

namespace PS0132E282\Core\Providers;

use Illuminate\Database\Migrations\Migrator;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use PS0132E282\Core\Base\PluginManager;
use PS0132E282\Core\Middleware\PermissionMiddleware;
use PS0132E282\Core\Middleware\RoleMiddleware;
use PS0132E282\Core\Traits\AutoReginPlugin;

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

        $this->bindPluginOverrides();
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

        if (! empty($pluginPaths)) {
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
            'user' => auth()->user(),
        ]);
        Inertia::share('flash', function () {
            return [
                'success' => session()->get('success'),
                'error' => session()->get('error'),
                'info' => session()->get('info'),
                'warning' => session()->get('warning'),
            ];
        });
        Inertia::share('ziggy', fn() => [
            ...(new \Tighten\Ziggy\Ziggy)->toArray(),
            'location' => request()->url(),
        ]);
    }

    protected function getLocales(): array
    {
        $locales = ['en', 'vi']; // Fallback/Default
        $langPath = __DIR__ . '/../../resources/lang';

        if (is_dir($langPath)) {
            $dirs = array_filter(scandir($langPath), function ($item) use ($langPath) {
                return $item !== '.' && $item !== '..' && is_dir($langPath . '/' . $item);
            });
            if (! empty($dirs)) {
                $locales = array_values($dirs);
            }
        }

        return $locales;
    }

    protected function getTranslations(): array
    {
        $translations = [];
        foreach ($this->getLocales() as $locale) {
            $translations[$locale] = $this->loadTranslations($locale);
        }

        return $translations;
    }

    protected function loadTranslations(string $locale): array
    {
        $data = [];
        $langPath = __DIR__ . '/../../resources/lang/' . $locale;

        if (is_dir($langPath)) {
            foreach (scandir($langPath) as $file) {
                if ($file === '.' || $file === '..') {
                    continue;
                }

                $filePath = "$langPath/$file";
                $name = pathinfo($file, PATHINFO_FILENAME);

                if (is_file($filePath)) {
                    if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
                        $data[$name] = include $filePath;
                    } elseif (pathinfo($file, PATHINFO_EXTENSION) === 'json') {
                        $content = file_get_contents($filePath);
                        $data[$name] = $content ? json_decode($content, true) : [];
                    }
                }
            }
        }

        // Also check root public/lang for overrides
        $jsonPath = public_path("lang/{$locale}.json");
        if (file_exists($jsonPath)) {
            $content = file_get_contents($jsonPath);
            $overrides = $content ? json_decode($content, true) : null;
            if (is_array($overrides)) {
                $data = array_replace_recursive($data, $overrides);
            }
        }

        return $data;
    }

    protected function getSidebarData(): array
    {
        $sidebarConfig = config('admin.sidebar') ?? config('cms.admin.sidebar') ?? [];
        $accountConfig = $sidebarConfig['account'] ?? [];

        $topItems = $this->processSidebarItems($sidebarConfig['top'] ?? []);

        if (isset($accountConfig['sidebar'])) {
            $topItems[] = $this->processSidebarItem($accountConfig['sidebar']);
        }

        $accountUserItems = [];
        if (isset($accountConfig['user']) && is_array($accountConfig['user'])) {
            $accountUserItems = $this->processSidebarItems($accountConfig['user']);
        } elseif (is_array($accountConfig) && ! isset($accountConfig['sidebar'])) {
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
        $filteredItems = [];
        $user = auth()->user();

        foreach ($items as $item) {
            $hasAccess = true;

            if (isset($item['route'])) {
                if ($item['route'] === 'admin.notifications.index') {
                    $item['badge'] = ($user && \Illuminate\Support\Facades\Schema::hasTable('notifications'))
                        ? $user->unreadNotifications()->count()
                        : 0;
                }

                if ($user) {
                    $permissionName = str_replace('admin.', '', $item['route']);
                    // Cho phép nhìn thấy dashboard, hoặc những modules có quyền
                    if ($item['route'] !== 'admin.site.dashboard' && $item['route'] !== 'admin.site.index' && $item['route'] !== 'admin.account.index' && $item['route'] !== 'admin.account.profile') {
                        if (! $user->can($permissionName)) {
                            $hasAccess = false;
                        }
                    }
                }

                $item['url'] = Route::has($item['route']) ? route($item['route']) : '#';
                if (empty($item['title'])) {
                    $item['route_name'] = $item['route'];
                }
                unset($item['route']);
            }

            if (! $hasAccess) {
                continue;
            }

            if (isset($item['children']) && is_array($item['children'])) {
                $item['children'] = $this->processSidebarItems($item['children']);

                if (empty($item['children']) && (! isset($item['url']) || $item['url'] === '#')) {
                    $hasAccess = false;
                }
            }

            if ($hasAccess) {
                $filteredItems[] = $item;
            }
        }

        return $filteredItems;
    }
}

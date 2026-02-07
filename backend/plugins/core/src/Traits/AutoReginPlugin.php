<?php

namespace PS0132E282\Core\Traits;

trait AutoReginPlugin
{
    public function register(): void
    {
        $this->registerConfigs();
        $this->registerHelpers();
        $this->bindPluginOverrides();
    }

    public function boot(): void
    {
        $this->registerViews();
        $this->registerRoutes();
        $this->registerMigrations();
        $this->registerCommands();
        $this->registerLanguages();
    }

    public function getPluginName(): string
    {
        $reflection = new \ReflectionClass(static::class);
        $filePath = $reflection->getFileName();

        $pluginsPos = strpos($filePath, DIRECTORY_SEPARATOR.'plugins'.DIRECTORY_SEPARATOR);

        if ($pluginsPos !== false) {
            $afterPlugins = substr($filePath, $pluginsPos + strlen(DIRECTORY_SEPARATOR.'plugins'.DIRECTORY_SEPARATOR));
            $pluginName = explode(DIRECTORY_SEPARATOR, $afterPlugins, 2)[0];

            if ($pluginName !== '') {
                return $pluginName;
            }
        }

        return str(class_basename(static::class))
            ->replace('ServiceProvider', '')
            ->snake()
            ->toString();
    }

    public function registerConfigs(): void
    {
        $pluginName = $this->getPluginName();
        $configDir = base_path('plugins'.DIRECTORY_SEPARATOR.$pluginName.DIRECTORY_SEPARATOR.'config');

        if (! is_dir($configDir)) {
            return;
        }

        $configFiles = glob($configDir.DIRECTORY_SEPARATOR.'*.php');

        foreach ($configFiles as $configFile) {
            $configName = basename($configFile, '.php');
            $this->mergeConfigFrom($configFile, $pluginName.'.'.$configName);
        }
    }

    public function registerRoutes(): void
    {
        $pluginName = $this->getPluginName();
        $routesDir = base_path('plugins'.DIRECTORY_SEPARATOR.$pluginName.DIRECTORY_SEPARATOR.'routes');

        // Đăng ký web routes
        $webRoutesPath = $routesDir.DIRECTORY_SEPARATOR.'web.php';
        if (file_exists($webRoutesPath)) {
            $this->loadRoutesFrom($webRoutesPath);
        }

        // Đăng ký API routes
        $apiRoutesPath = $routesDir.DIRECTORY_SEPARATOR.'api.php';
        if (file_exists($apiRoutesPath)) {
            $this->loadRoutesFrom($apiRoutesPath);
        }
    }

    public function registerViews(): void
    {
        $pluginName = $this->getPluginName();
        $viewsDir = base_path('plugins'.DIRECTORY_SEPARATOR.$pluginName.DIRECTORY_SEPARATOR.'resources'.DIRECTORY_SEPARATOR.'views');

        if (is_dir($viewsDir)) {
            $this->loadViewsFrom($viewsDir, $pluginName);
        }
    }

    public function registerMigrations(): void
    {
        $pluginName = $this->getPluginName();
        $migrationsDir = base_path('plugins'.DIRECTORY_SEPARATOR.$pluginName.DIRECTORY_SEPARATOR.'database'.DIRECTORY_SEPARATOR.'migrations');

        if (is_dir($migrationsDir)) {
            $this->loadMigrationsFrom($migrationsDir);
        }
    }

    public function registerCommands(): void
    {
        $pluginName = $this->getPluginName();
        $commandsDir = base_path('plugins'.DIRECTORY_SEPARATOR.$pluginName.DIRECTORY_SEPARATOR.'src'.DIRECTORY_SEPARATOR.'Commands');

        if (! is_dir($commandsDir)) {
            return;
        }

        $commandFiles = glob($commandsDir.DIRECTORY_SEPARATOR.'*.php');

        foreach ($commandFiles as $commandFile) {
            $className = $this->getClassNameFromFile($commandFile, $pluginName);

            if ($className && class_exists($className)) {
                $reflection = new \ReflectionClass($className);

                if ($reflection->isSubclassOf(\Illuminate\Console\Command::class) && ! $reflection->isAbstract()) {
                    $this->commands([$className]);
                }
            }
        }
    }

    protected function getClassNameFromFile(string $filePath, string $pluginName): ?string
    {
        $content = file_get_contents($filePath);

        if ($content === false) {
            return null;
        }

        // Extract namespace
        $namespace = null;
        if (preg_match('/namespace\s+([^;]+);/', $content, $matches)) {
            $namespace = trim($matches[1]);
        }

        // Extract class name
        $className = null;
        if (preg_match('/class\s+(\w+)/', $content, $matches)) {
            $className = $matches[1];
        }

        if ($namespace && $className) {
            return $namespace.'\\'.$className;
        }

        return null;
    }

    protected function registerHelpers(): void
    {
        $pluginName = $this->getPluginName();
        $helperPath = base_path('plugins'.DIRECTORY_SEPARATOR.$pluginName.DIRECTORY_SEPARATOR.'src'.DIRECTORY_SEPARATOR.'Helper.php');

        if (file_exists($helperPath)) {
            require_once $helperPath;
        }
    }

    public function registerLanguages(): void
    {
        $pluginName = $this->getPluginName();
        $langDir = base_path('plugins'.DIRECTORY_SEPARATOR.$pluginName.DIRECTORY_SEPARATOR.'resources'.DIRECTORY_SEPARATOR.'lang');

        if (is_dir($langDir)) {
            $this->loadTranslationsFrom($langDir, $pluginName);
        }
    }

    /**
     * Bind plugin overrides for models and controllers
     */
    protected function bindPluginOverrides(): void
    {
        $plugins = config('plugins', config('core.plugins', []));
        if (! is_array($plugins)) {
            return;
        }

        $str = \Illuminate\Support\Str::class;

        foreach ($plugins as $name => $plugin) {
            if (! isset($plugin['enabled']) || $plugin['enabled'] !== true) {
                continue;
            }

            $pluginName = $str::studly($plugin['name'] ?? $name);

            // # SUGGESTION: Handle Model Overrides
            if (isset($plugin['models']) && is_array($plugin['models'])) {
                $modelNamespace = "PS0132E282\\{$pluginName}\\Models";
                foreach ($plugin['models'] as $original => $override) {
                    $originalClass = str_contains($original, '\\') ? $original : $modelNamespace.'\\'.$original;
                    $this->app->bind($originalClass, $override);
                }
            }

            // # SUGGESTION: Handle Controller Overrides
            if (isset($plugin['controllers']) && is_array($plugin['controllers'])) {
                $controllerNamespace = "PS0132E282\\{$pluginName}\\Http\\Controllers";
                foreach ($plugin['controllers'] as $original => $override) {
                    $originalClass = str_contains($original, '\\') ? $original : $controllerNamespace.'\\'.$original;
                    $this->app->bind($originalClass, $override);
                }
            }
        }
    }
}

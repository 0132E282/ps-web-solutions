<?php

namespace PS0132E282\Core\Traits;

trait AutoReginPlugin
{
    public function register(): void
    {
        $this->registerConfigs();
        $this->registerHelpers();
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

        $pluginsPos = strpos($filePath, DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR);

        if ($pluginsPos !== false) {
            $afterPlugins = substr($filePath, $pluginsPos + strlen(DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR));
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
        $configDir = base_path('plugins' . DIRECTORY_SEPARATOR . $pluginName . DIRECTORY_SEPARATOR . 'config');

        if (!is_dir($configDir)) {
            return;
        }

        $configFiles = glob($configDir . DIRECTORY_SEPARATOR . '*.php');

        foreach ($configFiles as $configFile) {
            $configName = basename($configFile, '.php');
            $this->mergeConfigFrom($configFile, $pluginName . '.' . $configName);
        }
    }

    public function registerRoutes(): void
    {
        $pluginName = $this->getPluginName();
        $routesDir = base_path('plugins' . DIRECTORY_SEPARATOR . $pluginName . DIRECTORY_SEPARATOR . 'routes');

        // Đăng ký Plugin routes (Gộp web và api)
        $pluginRoutesPath = $routesDir . DIRECTORY_SEPARATOR . $pluginName . '.php';
        if (file_exists($pluginRoutesPath)) {
            $this->loadRoutesFrom($pluginRoutesPath);
        }
    }

    public function registerViews(): void
    {
        $pluginName = $this->getPluginName();
        $viewsDir = base_path('plugins' . DIRECTORY_SEPARATOR . $pluginName . DIRECTORY_SEPARATOR . 'resources' . DIRECTORY_SEPARATOR . 'views');

        if (is_dir($viewsDir)) {
            $this->loadViewsFrom($viewsDir, $pluginName);
        }
    }

    public function registerMigrations(): void
    {
        $pluginName = $this->getPluginName();
        $migrationsDir = base_path('plugins' . DIRECTORY_SEPARATOR . $pluginName . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'migrations');

        if (is_dir($migrationsDir)) {
            $this->loadMigrationsFrom($migrationsDir);
        }
    }

    public function registerCommands(): void
    {
        $pluginName = $this->getPluginName();
        $commandsDir = base_path('plugins' . DIRECTORY_SEPARATOR . $pluginName . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'Commands');

        if (!is_dir($commandsDir)) {
            return;
        }

        $commandFiles = glob($commandsDir . DIRECTORY_SEPARATOR . '*.php');

        foreach ($commandFiles as $commandFile) {
            $className = $this->getClassNameFromFile($commandFile, $pluginName);

            if ($className && class_exists($className)) {
                $reflection = new \ReflectionClass($className);

                if ($reflection->isSubclassOf(\Illuminate\Console\Command::class) && !$reflection->isAbstract()) {
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
            return $namespace . '\\' . $className;
        }

        return null;
    }

    protected function registerHelpers(): void
    {
        $pluginName = $this->getPluginName();
        $helperPath = base_path('plugins' . DIRECTORY_SEPARATOR . $pluginName . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'Helper.php');

        if (file_exists($helperPath)) {
            require_once $helperPath;
        }
    }

    public function registerLanguages(): void
    {
        $pluginName = $this->getPluginName();
        $langDir = base_path('plugins' . DIRECTORY_SEPARATOR . $pluginName . DIRECTORY_SEPARATOR . 'resources' . DIRECTORY_SEPARATOR . 'lang');

        if (is_dir($langDir)) {
            $this->loadTranslationsFrom($langDir, $pluginName);
        }
    }
}

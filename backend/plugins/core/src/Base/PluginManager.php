<?php

namespace PS0132E282\Core\Base;

use Illuminate\Support\Str;

class PluginManager
{
    /**
     * Get enabled plugin service providers
     *
     * @return array<string>
     */
    public static function getEnabledPluginProviders(): array
    {
        $providers = [];

        $pluginsConfigPath = base_path('config/plugins.php');

        if (! file_exists($pluginsConfigPath)) {
            return $providers;
        }

        $plugins = require $pluginsConfigPath;

        foreach ($plugins as $plugin) {
            if (! isset($plugin['enabled']) || $plugin['enabled'] !== true) {
                continue;
            }

            if (! isset($plugin['name'])) {
                continue;
            }

            $pluginName = $plugin['name'];

            $pascalCaseName = Str::studly($pluginName);
            $serviceProviderClass = "PS0132E282\\{$pascalCaseName}\\Providers\\{$pascalCaseName}ServiceProvider";

            if (class_exists($serviceProviderClass)) {
                $providers[] = $serviceProviderClass;
            }
        }

        return $providers;
    }

    /**
     * Get all migration paths from enabled plugins
     *
     * @return array<string>
     */
    public static function getPluginMigrationPaths(): array
    {
        $paths = [];

        $pluginsConfigPath = base_path('config/plugins.php');

        if (! file_exists($pluginsConfigPath)) {
            return $paths;
        }

        $plugins = require $pluginsConfigPath;

        foreach ($plugins as $plugin) {
            if (! isset($plugin['enabled']) || $plugin['enabled'] !== true) {
                continue;
            }

            if (! isset($plugin['name'])) {
                continue;
            }

            $pluginName = $plugin['name'];

            // Try standard location: plugins/{name}/database/migrations
            $migrationsDir = base_path('plugins'.DIRECTORY_SEPARATOR.$pluginName.DIRECTORY_SEPARATOR.'database'.DIRECTORY_SEPARATOR.'migrations');

            // Try alternative location: plugins/{name}/src/Database/migrations
            if (! is_dir($migrationsDir)) {
                $migrationsDir = base_path('plugins'.DIRECTORY_SEPARATOR.$pluginName.DIRECTORY_SEPARATOR.'src'.DIRECTORY_SEPARATOR.'Database'.DIRECTORY_SEPARATOR.'migrations');
            }

            if (is_dir($migrationsDir)) {
                $paths[] = $migrationsDir;
            }
        }

        return $paths;
    }
}

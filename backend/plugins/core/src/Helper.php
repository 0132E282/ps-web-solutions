<?php

if (! function_exists('current_locale')) {
    function current_locale(): string
    {
        return request()->get('locale', app()->getLocale() ?? 'en');
    }
}

if (! function_exists('model_class')) {
    /**
     * Resolve model class from type or return provided class.
     *
     * @param  string|null  $type  The model type (e.g., 'posts', 'categories')
     * @param  string|null  $class  Override class (returned as-is if provided)
     * @return string|null The resolved FQCN or null if not found
     */
    function model_class(?string $type = null, ?string $class = null): ?string
    {
        static $cache = [];
        $lookupKey = $class ?: $type;

        if (! $lookupKey) {
            return null;
        }

        if (isset($cache[$lookupKey])) {
            return $cache[$lookupKey];
        }

        $str = \Illuminate\Support\Str::class;

        // Filter enabled plugins once (DRY)
        $enabledPlugins = array_filter(
            config('plugins', []),
            fn (array $plugin): bool => $plugin['enabled'] ?? false
        );

        // 1. If class is provided, check for explicit overrides first
        if ($class) {
            foreach ($enabledPlugins as $name => $plugin) {
                $explicitModels = $plugin['models'] ?? [];
                // Check for FQCN match
                if (isset($explicitModels[$class])) {
                    return $cache[$lookupKey] = $explicitModels[$class];
                }
                // Check for short name match
                $shortName = class_basename($class);
                if (isset($explicitModels[$shortName])) {
                    return $cache[$lookupKey] = $explicitModels[$shortName];
                }
            }

            return $cache[$lookupKey] = $class;
        }

        $modelName = $str::studly($str::singular($type));

        // 2. Try explicit mapping from enabled plugins by type
        foreach ($enabledPlugins as $name => $plugin) {
            $explicitModels = $plugin['models'] ?? [];
            if (isset($explicitModels[$modelName])) {
                return $cache[$lookupKey] = $explicitModels[$modelName];
            }
        }

        // 3. Try convention-based discovery
        foreach ($enabledPlugins as $name => $plugin) {
            $pluginName = $str::studly($plugin['name'] ?? $name);
            $fullClass = "PS0132E282\\{$pluginName}\\Models\\{$modelName}";

            if (class_exists($fullClass)) {
                return $cache[$lookupKey] = $fullClass;
            }
        }

        return $cache[$lookupKey] = null;
    }
}

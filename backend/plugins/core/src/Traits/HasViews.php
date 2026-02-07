<?php

namespace PS0132E282\Core\Traits;

trait HasViews
{
    /**
     * Get page/view name for a given action
     *
     * @param string $action
     * @return string
     */
    protected function getPage(string $action): string
    {
        $viewKey = in_array($action, ['show', 'create', 'edit']) ? 'form' : $action;
        $reflection = new \ReflectionClass($this);

        if ($reflection->hasConstant('views')) {
            $views = $reflection->getConstant('views');
            if (isset($views[$viewKey]['view'])) {
                return $views[$viewKey]['view'];
            }
        }

        return ($action === 'index') ? 'core/items/index' : 'core/items/form';
    }

    /**
     * Get view config for a given action
     *
     * @param string $action
     * @return array
     */
    protected function getViewConfig(string $action): array
    {
        $viewKey = in_array($action, ['show', 'create', 'edit']) ? 'form' : $action;
        $reflection = new \ReflectionClass($this);

        if (!$reflection->hasConstant('views')) {
            return $this->generateFormConfigIfNeeded($viewKey);
        }

        $views = $reflection->getConstant('views');
        if (!isset($views[$viewKey])) {
            return $this->generateFormConfigIfNeeded($viewKey);
        }

        $config = $views[$viewKey];

        // Handle form config merging
        if ($viewKey === 'form') {
            $config = $this->mergeFormConfig($config);
        }

        // Auto-generate actions
        if (empty($config['actions']) && method_exists($this, 'getRouteName')) {
            $config['actions'] = $viewKey === 'index'
                ? ['edit' => ['name' => 'Edit', 'icon' => 'Edit', 'route' => $this->getRouteName('edit')]]
                : ['save' => ['name' => 'Save', 'icon' => 'Save', 'route' => $this->getRouteName('store')]];
        }

        $result = ['config' => array_diff_key($config, array_flip(['view']))];

        if (isset($config['filters'])) {
            $translatedFilters = method_exists($this, 'translateFilters')
                ? $this->translateFilters($config['filters'])
                : $config['filters'];
            $result['filters'] = $translatedFilters;
            $result['config']['filters'] = $translatedFilters;
        }

        if (isset($config['actions'])) {
            $result['actions'] = $config['actions'];
        }

        return $result;
    }

    /**
     * Generate form config if needed (fallback when views constant not found)
     *
     * @param string $viewKey
     * @return array
     */
    protected function generateFormConfigIfNeeded(string $viewKey): array
    {
        if ($viewKey === 'form' && method_exists($this, 'generateFormConfigFromModel')) {
            $generatedConfig = $this->generateFormConfigFromModel();
            if (!empty($generatedConfig)) {
                return ['config' => $generatedConfig];
            }
        }
        return [];
    }

    /**
     * Merge form config with model configs
     *
     * @param array $config
     * @return array
     */
    protected function mergeFormConfig(array $config): array
    {
        if (!empty($config['sections']) && method_exists($this, 'mergeFormFieldsWithModelConfigs')) {
            return $this->mergeFormFieldsWithModelConfigs($config);
        }

        if (empty($config['sections']) && method_exists($this, 'generateFormConfigFromModel')) {
            $generatedConfig = $this->generateFormConfigFromModel();
            if (!empty($generatedConfig['sections'])) {
                $config['sections'] = $generatedConfig['sections'];
                $config['title'] ??= $generatedConfig['title'] ?? null;
                $config['description'] ??= $generatedConfig['description'] ?? null;
            }
        }

        return $config;
    }

    /**
     * Get route from controller views config (ưu tiên cao nhất)
     *
     * @param string $fieldName
     * @return string|null
     */
    protected function getRouteFromControllerViews(string $fieldName): ?string
    {
        $reflection = new \ReflectionClass($this);
        if (!$reflection->hasConstant('views')) {
            return null;
        }

        $views = $reflection->getConstant('views');

        // Check form sections for field config
        if (isset($views['form']['sections'])) {
            foreach ($views['form']['sections'] as $sectionItems) {
                if (!is_array($sectionItems)) {
                    continue;
                }

                foreach ($sectionItems as $sectionItem) {
                    if (!is_array($sectionItem) || !isset($sectionItem['fields'])) {
                        continue;
                    }

                    foreach ($sectionItem['fields'] as $field) {
                        if (is_array($field) && isset($field['name']) && $field['name'] === $fieldName) {
                            if (isset($field['config']['source']['route'])) {
                                return $field['config']['source']['route'];
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Extract field names from fields array (supports both string array and object array)
     *
     * @param array $fields
     * @return array
     */
    protected function extractFieldNames(array $fields): array
    {
        $fieldNames = [];

        foreach ($fields as $field) {
            if (is_string($field)) {
                $fieldNames[] = $field;
            } elseif (is_array($field)) {
                // Support multiple keys: name, accessorKey, key, field
                $key = $field['name'] ?? $field['accessorKey'] ?? $field['key'] ?? $field['field'] ?? null;
                if ($key) {
                    $fieldNames[] = $key;
                }
            }
        }

        return $fieldNames;
    }

    /**
     * Get fields from form config sections
     *
     * @return array
     */
    protected function getFieldsFromFormConfig(): array
    {
        $reflection = new \ReflectionClass($this);
        if (!$reflection->hasConstant('views')) {
            return [];
        }

        $views = $reflection->getConstant('views');
        if (!isset($views['form']['sections']) || !is_array($views['form']['sections'])) {
            return [];
        }

        $fieldNames = [];
        foreach ($views['form']['sections'] as $sectionItems) {
            if (!is_array($sectionItems)) {
                continue;
            }

            foreach ($sectionItems as $sectionItem) {
                if (isset($sectionItem['fields']) && is_array($sectionItem['fields'])) {
                    $fieldNames = array_merge($fieldNames, $this->extractFieldNames($sectionItem['fields']));
                }
            }
        }

        return array_unique($fieldNames);
    }
}

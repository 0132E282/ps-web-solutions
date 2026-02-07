<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

trait HasFormConfig
{
    /**
     * Generate form config from model $configs property
     */
    protected function generateFormConfigFromModel(): array
    {
        if (! $this->hasModel()) {
            return [];
        }

        $modelInstance = $this->resolveModelInstance();
        $modelConfigs = $this->extractModelConfigs($modelInstance);

        if (empty($modelConfigs)) {
            return [];
        }

        $mainFields = [];
        $sidebarFields = [];

        foreach ($modelConfigs as $fieldName => $fieldConfig) {
            $processedConfig = $this->processFieldConfigFromModel($fieldName, $fieldConfig, $modelInstance);
            $viewFieldConfig = $this->buildFieldConfigFromModel($fieldName, $processedConfig);

            if ($this->isSidebarField($fieldName, $processedConfig)) {
                $sidebarFields[] = $viewFieldConfig;
            } else {
                $mainFields[] = $viewFieldConfig;
            }
        }

        $sections = $this->buildFormSections($mainFields, $sidebarFields);

        $formConfig = [
            'title' => $this->getModelName(),
            'description' => $this->getModelName().' details',
            'sections' => $sections,
            'actions' => [
                'save' => [
                    'name' => 'Save',
                    'icon' => 'Save',
                    'route' => $this->getRouteName('store'),
                ],
            ],
        ];

        return $formConfig;
    }

    /**
     * Process field config from model: parse validation, auto-detect source, resolve routes
     */
    protected function processFieldConfigFromModel(string $fieldName, array $fieldConfig, $modelInstance): array
    {
        $type = $fieldConfig['ui'] ?? $fieldConfig['type'] ?? 'text';
        $config = $fieldConfig['config'] ?? [];
        $this->parseValidationToRequired($config);
        $this->processQueryConfig($config, $modelInstance, $fieldName);
        $this->autoDetectSourceConfig($fieldName, $type, $config, $modelInstance);
        $this->processOptionsConfig($config);
        $config = $this->resolveRoutesInConfig($config, $fieldName, $modelInstance);

        return array_merge(['ui' => $type, 'type' => $type], $config);
    }

    /**
     * Build field config for view from processed config
     */
    protected function buildFieldConfigFromModel(string $fieldName, array $processedConfig): array
    {
        $type = $processedConfig['type'] ?? 'text';
        $config = $processedConfig;
        unset($config['type']);

        return [
            'name' => $fieldName,
            'config' => array_merge([
                'type' => $type,
                'label' => $this->generateLabelFromFieldName($fieldName),
            ], $config),
        ];
    }

    /**
     * Check if field should go to sidebar
     */
    protected function isSidebarField(string $fieldName, array $processedConfig): bool
    {
        if (isset($processedConfig['sidebar'])) {
            return (bool) $processedConfig['sidebar'];
        }

        $type = $processedConfig['type'] ?? 'text';

        return str_contains($fieldName, '_id') && $type === 'select';
    }

    /**
     * Build form sections from main and sidebar fields
     */
    protected function buildFormSections(array $mainFields, array $sidebarFields): array
    {
        $sections = [];

        if (! empty($mainFields)) {
            $sections['main'] = [[
                'header' => [
                    'title' => $this->getModelName().' Details',
                    'description' => $this->getModelName().' information',
                ],
                'fields' => $mainFields,
            ]];
        }

        if (! empty($sidebarFields)) {
            $sections['sidebar'] = [[
                'header' => [
                    'title' => 'Settings',
                    'description' => 'Settings information',
                ],
                'fields' => $sidebarFields,
            ]];
        }

        return $sections;
    }

    /**
     * Merge form fields (string array) with model configs
     */
    protected function mergeFormFieldsWithModelConfigs(array $config): array
    {
        if (! $this->hasModel() || ! isset($config['sections'])) {
            return $config;
        }

        $modelInstance = $this->resolveModelInstance();
        $modelConfigs = $this->extractModelConfigs($modelInstance);

        if (empty($modelConfigs)) {
            return $config;
        }

        foreach ($config['sections'] as $sectionKey => $sectionItems) {
            if (! is_array($sectionItems)) {
                continue;
            }

            foreach ($sectionItems as $index => $sectionItem) {
                if (! is_array($sectionItem) || ! isset($sectionItem['fields'])) {
                    continue;
                }

                $fields = $sectionItem['fields'];
                $mergedFields = [];

                foreach ($fields as $field) {
                    $mergedFields[] = is_string($field)
                        ? $this->processStringField($field, $modelConfigs, $modelInstance)
                        : $this->processArrayField($field, $modelConfigs, $modelInstance);
                }

                $config['sections'][$sectionKey][$index]['fields'] = $mergedFields;
            }
        }

        return $config;
    }

    /**
     * Process string field (field name only) and convert to full config
     */
    protected function processStringField(string $fieldName, array $modelConfigs, $modelInstance): array
    {
        if (! isset($modelConfigs[$fieldName])) {
            return [
                'name' => $fieldName,
                'config' => [
                    'type' => 'text',
                    'label' => $this->generateLabelFromFieldName($fieldName),
                ],
            ];
        }

        $fieldConfig = $modelConfigs[$fieldName];
        $processedConfig = $this->processFieldConfigFromModel($fieldName, $fieldConfig, $modelInstance);

        return $this->buildFieldConfigFromModel($fieldName, $processedConfig);
    }

    /**
     * Process array field and merge with model configs
     */
    protected function processArrayField(array $field, array $modelConfigs, $modelInstance): array
    {
        if (! isset($field['name']) || ! isset($modelConfigs[$field['name']])) {
            return $field;
        }

        $fieldName = $field['name'];
        $fieldConfig = $modelConfigs[$fieldName];
        $processedConfig = $this->processFieldConfigFromModel($fieldName, $fieldConfig, $modelInstance);

        $type = $processedConfig['type'] ?? 'text';
        $config = $processedConfig;
        unset($config['type']);

        $mergedConfig = array_merge([
            'type' => $type,
            'label' => $this->generateLabelFromFieldName($fieldName),
        ], $config, $field['config'] ?? []);

        return [
            'name' => $fieldName,
            'config' => $mergedConfig,
        ];
    }

    /**
     * Process query config - keep query config as is, let frontend handle it
     */
    protected function processQueryConfig(array &$config, $modelInstance, ?string $fieldName = null): void
    {
        if (! isset($config['query']) || ! is_array($config['query'])) {
            return;
        }

        if (! isset($config['query']['collection']) && $fieldName) {
            $config['query']['collection'] = str_replace('_id', '', $fieldName);
        }
    }

    /**
     * Process options config: convert simple associative array to label/value format
     */
    protected function processOptionsConfig(array &$config): void
    {
        if (! isset($config['options']) || ! is_array($config['options']) || empty($config['options'])) {
            return;
        }

        $options = $config['options'];
        $firstKey = array_key_first($options);
        $firstValue = $options[$firstKey];

        if (is_array($firstValue) && isset($firstValue['label']) && isset($firstValue['value'])) {
            return;
        }

        $newOptions = [];
        foreach ($options as $key => $label) {
            $processedLabel = is_string($label) && str_contains($label, '.') ? __($label) : $label;

            $newOptions[] = [
                'label' => $processedLabel,
                'value' => is_int($key) ? $label : $key,
            ];
        }

        $config['options'] = $newOptions;
    }

    /**
     * Auto-detect and generate source config for select fields
     */
    protected function autoDetectSourceConfig(string $fieldName, string $type, array &$config, $modelInstance): void
    {
        if (! in_array($type, ['select', 'multiple-selects', 'button-radio']) || isset($config['source'])) {
            return;
        }

        $relationshipName = null;

        if (isset($config['collection'])) {
            $pluralName = Str::plural($config['collection']);
            $config['source'] = [
                'route' => "admin.{$pluralName}.index",
                'params' => ['fields' => ['id', 'name', 'title']],
                'valueKey' => 'id',
                'labelKey' => 'title',
            ];

            return;
        }

        if (str_ends_with($fieldName, '_id')) {
            $relationshipName = str_replace('_id', '', $fieldName);
        } elseif (method_exists($modelInstance, $fieldName)) {
            $relationshipName = $fieldName;
        }

        if ($relationshipName) {
            $sourceConfig = $this->generateSourceFromRelationship($modelInstance, $relationshipName);
            if ($sourceConfig) {
                $config['source'] = $sourceConfig;
            }
        }
    }

    /**
     * Generate source config from relationship name
     */
    protected function generateSourceFromRelationship($modelInstance, string $relationshipName): ?array
    {
        if (! method_exists($modelInstance, $relationshipName)) {
            return null;
        }

        try {
            $relation = $modelInstance->$relationshipName();
            if (! ($relation instanceof \Illuminate\Database\Eloquent\Relations\Relation)) {
                return null;
            }

            $relatedModel = get_class($relation->getRelated());
            $currentModel = get_class($modelInstance);
            $relatedModelName = class_basename($relatedModel);

            $routeName = $this->generateRouteFromModel($relatedModelName);

            $fields = ['id'];
            $labelKey = 'id';

            $relatedInstance = new $relatedModel;
            $tableName = $relatedInstance->getTable();

            if (Schema::hasColumn($tableName, 'name')) {
                $fields[] = 'name';
                $labelKey = 'name';
            } elseif (Schema::hasColumn($tableName, 'title')) {
                $fields[] = 'title';
                $labelKey = 'title';
            }

            $params = ['fields' => $fields];

            if ($relatedModel === $currentModel && property_exists($modelInstance, 'type')) {
                $type = $modelInstance::$type ?? null;
                if ($type) {
                    $params['filters'] = [
                        '_and' => [
                            'type' => ['_eq' => $type],
                        ],
                    ];
                }
            }

            return [
                'route' => $routeName,
                'params' => $params,
                'valueKey' => 'id',
                'labelKey' => $labelKey,
            ];
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Generate route name from model name
     */
    protected function generateRouteFromModel(string $modelName): string
    {
        $kebabName = Str::kebab($modelName);
        $pluralName = Str::plural($kebabName);

        return "admin.{$pluralName}.index";
    }

    /**
     * Generate route name from collection name
     */
    protected function generateRouteFromCollection(string $collection): string
    {
        $pluralName = Str::plural($collection);

        return "admin.{$pluralName}.index";
    }

    /**
     * Resolve routes in config to use current controller's route
     */
    protected function resolveRoutesInConfig(array $config, string $fieldName, $modelInstance = null): array
    {
        if (! $this->hasModel()) {
            return $config;
        }

        if (isset($config['source']['route'])) {
            $controllerRoute = $this->getRouteFromControllerViews($fieldName);
            if ($controllerRoute) {
                $config['source']['route'] = $controllerRoute;

                return $config;
            }

            $currentRoutePrefix = $this->getRouteName('index');

            $modelReflection = $this->resolveModelReflection();
            $parentClass = $modelReflection->getParentClass();

            if ($parentClass && $parentClass->getName() !== 'Illuminate\Database\Eloquent\Model') {
                $config['source']['route'] = $currentRoutePrefix;
            }
        }

        return $config;
    }

    /**
     * Detect label key from fields array
     */
    protected function detectLabelKey(array $fields): string
    {
        if (in_array('title', $fields)) {
            return 'title';
        }
        if (in_array('name', $fields)) {
            return 'name';
        }

        return 'id';
    }

    /**
     * Generate label from field name (snake_case to Title Case)
     */
    protected function generateLabelFromFieldName(string $fieldName): string
    {
        $cleanName = str_replace('_id', '', $fieldName);
        $words = explode('_', $cleanName);
        $words = array_map('ucfirst', $words);

        return implode(' ', $words);
    }

    /**
     * Get model name for labels
     */
    protected function getModelName(): string
    {
        if (! $this->hasModel()) {
            return 'Item';
        }

        $modelName = class_basename($this->model);
        $modelName = preg_replace('/([a-z])([A-Z])/', '$1 $2', $modelName);

        return $modelName;
    }
}

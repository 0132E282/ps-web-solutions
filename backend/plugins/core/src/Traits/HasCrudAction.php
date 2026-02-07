<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use ReflectionClass;
use ReflectionMethod;

trait HasCrudAction
{
    use FieldTrait;
    use FilterTrait;
    use HasViews;

    protected ?string $cachedPluginName = null;

    protected ?array $cachedConfigs = null;

    protected function getPluginName(): string
    {
        return $this->cachedPluginName ??= $this->resolvePluginName();
    }

    protected function resolvePluginName(): string
    {
        $reflection = new ReflectionClass($this);
        $filePath = $reflection->getFileName();

        if ($filePath && ($pluginName = $this->extractPluginNameFromPath($filePath))) {
            return $pluginName;
        }

        return $this->getPluginNameFromClassName();
    }

    protected function extractPluginNameFromPath(string $filePath): ?string
    {
        $delimiter = DIRECTORY_SEPARATOR.'plugins'.DIRECTORY_SEPARATOR;
        if (! str_contains($filePath, $delimiter)) {
            return null;
        }

        $afterPlugins = explode($delimiter, $filePath, 2)[1] ?? '';
        $pluginName = explode(DIRECTORY_SEPARATOR, $afterPlugins, 2)[0] ?? '';

        return $pluginName ?: null;
    }

    protected function getPluginNameFromClassName(): string
    {
        return Str::of(class_basename(static::class))
            ->replace('Controller', '')
            ->snake()
            ->toString();
    }

    protected function getConfigs(): array
    {
        if ($this->cachedConfigs !== null) {
            return $this->cachedConfigs;
        }

        $pluginName = $this->getPluginName();
        $configDir = base_path("plugins/{$pluginName}/config");
        $configs = [];

        if (is_dir($configDir)) {
            foreach (glob("{$configDir}/*.php") as $configFile) {
                $name = basename($configFile, '.php');
                $key = "{$pluginName}.{$name}";
                if (config()->has($key)) {
                    $configs[$name] = config($key);
                }
            }
        }

        return $this->cachedConfigs = $configs;
    }

    protected function processColumnsFromFields(array $fields): array
    {
        if (! isset($this->model)) {
            return [];
        }

        $modelInstance = new $this->model;
        $tableName = $modelInstance->getTable();

        return array_values(array_filter(array_map(
            fn ($field) => $this->processSingleColumn($field, $modelInstance, $tableName),
            $fields
        )));
    }

    protected function processSingleColumn($field, $modelInstance, string $tableName): ?array
    {
        $config = $this->normalizeFieldConfig($field);
        if (! $config) {
            return null;
        }

        $defaults = [
            'meta' => [
                'type' => $this->getFieldType($config['accessorKey'], $modelInstance, $tableName),
            ],
            'id' => $config['accessorKey'],
        ];

        $config['meta'] = array_merge($config['meta'] ?? [], $defaults['meta']);
        $config['id'] ??= $defaults['id'];

        if (($config['config']['primary'] ?? false) && ! isset($config['config']['link'])) {
            $config['config']['link'] = true;
        }

        return $config;
    }

    protected function normalizeFieldConfig($field): ?array
    {
        if (is_string($field)) {
            return ['accessorKey' => $field, 'header' => $field];
        }

        if (is_array($field)) {
            $name = $field['name'] ?? $field['accessorKey'] ?? $field['key'] ?? $field['field'] ?? null;
            if (! $name) {
                return null;
            }

            $field['accessorKey'] ??= $name;

            return $field;
        }

        return null;
    }

    /**
     * Apply tree query logic to a query builder
     */
    public static function queryTree(Builder $query, ?string $parentColumn = 'parent_id', ?string $orderColumn = 'created_at', string $direction = 'desc'): Builder
    {
        return $query->orderByRaw("CASE WHEN {$parentColumn} IS NULL THEN 0 ELSE 1 END")
            ->when($orderColumn, fn ($q) => $q->orderBy($orderColumn, $direction));
    }

    protected function loadItems()
    {
        $query = $this->model::query();
        $fieldsString = $this->getFieldsString();

        // Apply fields
        $this->applyFields($query, $fieldsString);

        // Load relationships from index config
        if ($relationships = $this->getIndexRelationships()) {
            $query->with($relationships);
        }

        // Apply filters
        $this->applyFilters($query);

        $viewConfig = $this->getViewConfig('index');
        $loadItems = $viewConfig['config']['load-items'] ?? $viewConfig['load-items'] ?? null;
        $isTreeMode = ($loadItems === 'tree') || request()->boolean('tree', false);

        if (! $isTreeMode) {
            $query->orderBy('created_at', 'desc');
        }

        $options = [];
        if ($isTreeMode) {
            $options['tree'] = true;
            $options['paginate'] = request()->boolean('paginate', false);
        }

        return $query->loadItems(null, $options);
    }

    protected function addRelationshipIfValid(array &$relationships, $modelInstance, string $name): void
    {
        foreach ([$name, Str::camel($name)] as $method) {
            if (method_exists($modelInstance, $method)) {
                $relation = $modelInstance->$method();
                if ($relation instanceof Relation && ! in_array($method, $relationships)) {
                    $relationships[] = $method;
                    break;
                }
            }
        }
    }

    protected function extractRelationshipFromFieldName(string $fieldName): string
    {
        return str_contains($fieldName, '.') ? explode('.', $fieldName)[0] : $fieldName;
    }

    protected function getIndexRelationships(): array
    {
        if (! isset($this->model)) {
            return [];
        }

        $viewConfig = $this->getViewConfig('index');
        $fields = $viewConfig['config']['fields'] ?? $viewConfig['fields'] ?? [];
        if (empty($fields)) {
            return [];
        }

        $relationships = [];
        $modelInstance = new $this->model;

        foreach ($fields as $field) {
            // Restore support for accessorKey in array or simple string
            $fieldName = is_string($field) ? $field : ($field['accessorKey'] ?? null);

            if ($fieldName) {
                $relName = $this->extractRelationshipFromFieldName($fieldName);
                $this->addRelationshipIfValid($relationships, $modelInstance, $relName);
            }
        }

        return $relationships;
    }

    protected function getFormRelationships(): array
    {
        if (! isset($this->model) || ! $this->hasViewConfig('form')) {
            return [];
        }

        $viewConfig = $this->getViewConfig('form');
        $sections = $viewConfig['config']['sections'] ?? $viewConfig['sections'] ?? [];
        $relationships = [];
        $modelInstance = new $this->model;

        foreach ($sections as $sectionItems) {
            $this->extractRelationshipsFromSection($sectionItems, $relationships, $modelInstance);
        }

        return $relationships;
    }

    protected function extractRelationshipsFromSection($sectionItems, array &$relationships, $modelInstance): void
    {
        if (! is_array($sectionItems)) {
            return;
        }

        foreach ($sectionItems as $item) {
            if (isset($item['fields'])) {
                $this->extractRelationshipsFromFields($item['fields'], $relationships, $modelInstance);
            }
        }
    }

    protected function extractRelationshipsFromFields(array $fields, array &$relationships, $modelInstance): void
    {
        foreach ($fields as $field) {
            $name = is_string($field) ? $field : ($field['name'] ?? null);
            if (! $name) {
                continue;
            }

            if (str_contains($name, '.')) {
                $this->addRelationshipIfValid($relationships, $modelInstance, $this->extractRelationshipFromFieldName($name));

                continue;
            }

            if (! $this->isDatabaseColumn($modelInstance, $name)) {
                $this->checkAndAddRelationMethod($name, $relationships, $modelInstance);
            }
        }
    }

    protected function isDatabaseColumn($model, string $field): bool
    {
        return Schema::hasColumn($model->getTable(), $field);
    }

    protected function checkAndAddRelationMethod(string $method, array &$relationships, $modelInstance): void
    {
        if (! method_exists($modelInstance, $method)) {
            return;
        }

        $reflection = new ReflectionMethod($modelInstance, $method);
        if ($reflection->isPublic() && $reflection->getNumberOfRequiredParameters() === 0) {
            $relation = $modelInstance->$method();
            if ($relation instanceof Relation) {
                $this->addRelationshipIfValid($relationships, $modelInstance, $method);
            }
        }
    }

    protected function getFieldsString(): ?string
    {
        if ($requestFields = $this->getFieldsFromRequest()) {
            return $requestFields;
        }

        $defaults = ['id', 'created_at'];
        $viewFields = [];

        if ($this->hasViewConfig('index')) {
            $viewConfig = $this->getViewConfig('index');
            $fields = $viewConfig['fields'] ?? $viewConfig['config']['fields'] ?? [];
            $viewFields = $this->extractFieldNames($fields);
        }

        $classFields = ! empty($this->fields) ? $this->extractFieldNames($this->fields) : [];

        return implode(',', array_unique(array_merge($defaults, $viewFields, $classFields)));
    }

    protected function getFieldType(string $fieldName, $modelInstance, string $tableName): string
    {
        if (! $this->isDatabaseColumn($modelInstance, $fieldName) && $this->isRelation($modelInstance, $fieldName)) {
            return 'array';
        }

        if ($type = $this->getFieldTypeFromCasts($modelInstance, $fieldName)) {
            return $type;
        }

        if (str_ends_with($fieldName, '_at')) {
            return 'date';
        }

        if ($this->isDatabaseColumn($modelInstance, $fieldName)) {
            return $this->mapDatabaseTypeToFieldType(Schema::getColumnType($tableName, $fieldName));
        }

        return 'text';
    }

    protected function isRelation($model, string $method): bool
    {
        return method_exists($model, $method) && ($model->$method() instanceof Relation);
    }

    protected function getFieldTypeFromCasts($model, string $field): ?string
    {
        $casts = $model->getCasts();

        return isset($casts[$field]) ? match ($casts[$field]) {
            'datetime', 'date', 'timestamp' => 'date',
            'boolean' => 'boolean',
            'integer', 'int', 'float', 'double', 'decimal' => 'number',
            default => 'text',
        } : null;
    }

    protected function mapDatabaseTypeToFieldType(string $dbType): string
    {
        return match ($dbType) {
            'datetime', 'timestamp', 'date' => 'date',
            'tinyint', 'smallint', 'mediumint', 'int', 'bigint', 'float', 'double', 'decimal', 'numeric' => 'number',
            'boolean' => 'boolean',
            default => 'text',
        };
    }

    protected function getFiltersTableIndex(): array
    {
        return (! empty($this->filters) && is_array($this->filters))
            ? $this->translateFilters($this->filters)
            : [];
    }

    protected function translateFilters(array $filters): array
    {
        return array_map(fn ($filter) => $this->translateSingleFilter($filter), $filters);
    }

    protected function translateSingleFilter($filter): array
    {
        if (is_string($filter)) {
            $filter = [
                'name' => $filter,
                'label' => $filter,
            ];
        }

        if (! is_array($filter)) {
            return [];
        }
        if (isset($filter['label'])) {
            $filter['label'] = $this->translateFilterLabel($filter['label']);
        }

        if (isset($filter['options']) && is_array($filter['options'])) {
            $filter['options'] = array_map(function ($option) {
                if (isset($option['label'])) {
                    $option['label'] = $this->translateFilterLabel($option['label']);
                }

                return $option;
            }, $filter['options']);
        }

        return $filter;
    }

    protected function translateFilterLabel(string $label): string
    {
        $key = "core::common.filters.{$label}";
        $translated = trans($key);

        if ($translated !== $key) {
            return $translated;
        }

        $direct = trans($label);

        return ($direct !== $label) ? $direct : $label;
    }

    protected function hasViewConfig(string $key): bool
    {
        return defined(static::class.'::views') && isset(constant(static::class.'::views')[$key]);
    }
}

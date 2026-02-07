<?php

namespace PS0132E282\Core\Base;

use App\Http\Controllers\Controller;
use PS0132E282\Core\Traits\HasCrudAction;
use PS0132E282\Core\Traits\AutoTransform;
use PS0132E282\Core\Traits\Relationships;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use PS0132E282\Core\Base\Resource;

class BaseController extends Controller
{
    use HasCrudAction, AutoTransform, Relationships;

    protected ?string $model =  null;

    function index()
    {

        $items = $this->loadItems();
        if (request()->wantsJson()) {
            return Resource::items($items);
        }

        $views = $this->getViewsConfig('index');
        $configs = $this->getModelConfigs();
        $inertiaData = [
            'views' => $views,
            'configs' => $configs,
        ];

        if ($items instanceof \Illuminate\Contracts\Pagination\LengthAwarePaginator) {
            $inertiaData['items'] = $items->items();
            $inertiaData['pagination'] = Resource::extractPagination($items);
        } else {
            // If items is a collection or array, pass as is
            $inertiaData['items'] = $items instanceof \Illuminate\Support\Collection
                ? $items->toArray()
                : (is_array($items) ? $items : []);
        }
        return Inertia::render($this->getPage('index'), $inertiaData);
    }

    function form($id = null)
    {
        $views = $this->getViewsConfig('form');
        $configs = $this->getModelConfigs();
        $item = null;
        if (!empty($id)) {
            $item = $this->loadItemForForm($id);
            if (request()->wantsJson()) {
                return Resource::item($item);
            }
        }
        return Inertia::render($this->getPage('form'), [
            'views' => $views,
            'configs' => $configs,
            'item' => $item,
        ]);
    }


    function edit($id, Request $request)
    {
        $item = $this->model::query()->findOrFail($id);
        $data = $this->prepareRequestData($request);
        $relationships = $this->extractRelationships($data);

        $item->update($data);

        if (!empty($relationships['relationships'])) {
            $this->syncRelationships($item, $relationships['relationships']);
        }



        if (request()->wantsJson()) {
            return Resource::item($item);
        }

        $views = $this->getViewsConfig('form');
        $configs = $this->getModelConfigs();

        return Inertia::render($this->getPage('form'), [
            'views' => $views,
            'configs' => $configs,
            'item' => $item,
            'isEdit' => true,
        ]);
    }

    function update($id, Request $request)
    {
        $item = $this->model::query()->findOrFail($id);
        $data = $this->prepareRequestData($request);
        $relationships = $this->extractRelationships($data);

        $item->update($data);

        if (!empty($relationships)) {
            $this->syncRelationships($item, $relationships['relationships']);
        }

        if (request()->wantsJson()) {
            return Resource::item($item);
        }

        return redirect()->route($this->getRouteName('index'))
            ->with('success', 'Cập nhật thành công');
    }

    function store(Request $request)
    {
        $data = $this->prepareRequestData($request);
        $relationships = $this->extractRelationships($data);

        $item = $this->model::query()->create($data);

        if (!empty($relationships['relationships'])) {
            $this->syncRelationships($item, $relationships['relationships']);
        }

        if (request()->wantsJson()) {
            return response()->json(['item' => $item], 201);
        }

        return redirect()->route($this->getRouteName('index'))
            ->with('success', 'Tạo thành công');
    }

    /**
     * Prepare request data by transforming and merging files
     *
     * @param Request $request
     * @return array
     */
    protected function prepareRequestData(Request $request): array
    {
        $data = $this->autoTransformRequest($request->all());
        $files = $request->allFiles();

        // Merge nested fields (property.*, seo.*, etc.) into parent objects
        $data = $this->mergeNestedFields($data);

        return !empty($files) ? array_merge($data, $files) : $data;
    }

    /**
     * Merge nested fields into parent objects
     * Example: property.type, property.values -> property: { type, values }
     *
     * @param array $data
     * @return array
     */
    protected function mergeNestedFields(array $data): array
    {
        $nestedGroups = [];
        $toRemove = [];

        // Find all nested fields (fields with dot notation)
        foreach ($data as $key => $value) {
            if (str_contains($key, '.')) {
                [$parentKey, $childKey] = explode('.', $key, 2);

                // Group nested fields by parent key
                if (!isset($nestedGroups[$parentKey])) {
                    $nestedGroups[$parentKey] = [];
                }

                // Support multiple levels of nesting
                $this->setNestedValue($nestedGroups[$parentKey], $childKey, $value);
                $toRemove[] = $key;
            }
        }

        // Remove original nested keys
        foreach ($toRemove as $key) {
            unset($data[$key]);
        }

        // Merge nested groups into parent keys
        foreach ($nestedGroups as $parentKey => $nestedData) {
            if (isset($data[$parentKey]) && is_array($data[$parentKey])) {
                // Merge with existing data
                $data[$parentKey] = array_merge($data[$parentKey], $nestedData);
            } else {
                // Create new parent key
                $data[$parentKey] = $nestedData;
            }
        }

        return $data;
    }

    /**
     * Set nested value in array using dot notation
     *
     * @param array &$array
     * @param string $key
     * @param mixed $value
     * @return void
     */
    protected function setNestedValue(array &$array, string $key, $value): void
    {
        if (!str_contains($key, '.')) {
            $array[$key] = $value;
            return;
        }

        $keys = explode('.', $key);
        $current = &$array;

        foreach ($keys as $i => $k) {
            if ($i === count($keys) - 1) {
                $current[$k] = $value;
            } else {
                if (!isset($current[$k]) || !is_array($current[$k])) {
                    $current[$k] = [];
                }
                $current = &$current[$k];
            }
        }
    }


    function destroy($id)
    {
        $item = $this->model::query()->findOrFail($id);

        $deleteRules = $this->getValidationRules('delete', $id);
        if (!empty($deleteRules)) {
            request()->validate($deleteRules);
        }

        $item->delete();

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Xóa thành công']);
        }

        return redirect()->route($this->getRouteName('index'))
            ->with('success', 'Xóa thành công');
    }

    /**
     * Duplicate an existing item
     * Creates a copy of the item with all its relationships
     *
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse
     */
    function duplicate($id, Request $request)
    {
        $item = $this->model::query()->findOrFail($id);

        $validRelationships = $this->loadRelationshipsForDuplication($item);
        $attributes = $this->prepareDuplicateAttributes($item);

        // Create new item
        $newItem = $this->model::query()->create($attributes);

        // Sync and Load relationships
        $this->duplicateRelationships($item, $newItem, $validRelationships);

        if (request()->wantsJson()) {
            return Resource::item($newItem);
        }

        return redirect()->route($this->getRouteName('index'))
            ->with('success', 'Nhân bản thành công');
    }


    protected function loadRelationshipsForDuplication($item)
    {
        $formRelationships = $this->getFormRelationships();
        if (empty($formRelationships)) {
            return [];
        }

        $validRelationships = $this->validateRelationships($formRelationships);
        if (!empty($validRelationships)) {
            $item->load($validRelationships);
        }

        return $validRelationships;
    }

    protected function prepareDuplicateAttributes($item): array
    {
        $attributes = $item->getAttributes();
        $baseExcludedInfo = ['id', 'created_at', 'updated_at', 'deleted_at'];

        foreach ($baseExcludedInfo as $key) {
            unset($attributes[$key]);
        }

        $copyTranslations = array_fill_keys($this->getAvailableLocales(), 'Copy');

        // Handle Slug
        if (isset($attributes['slug'])) {
            $attributes['slug'] = $this->processLocalizedCopy($item, 'slug', $attributes['slug'], $copyTranslations, '-copy');
        }

        // Handle Title/Name
        foreach (['title', 'name'] as $field) {
            if (isset($attributes[$field])) {
                $attributes[$field] = $this->processLocalizedCopy($item, $field, $attributes[$field], $copyTranslations);
            }
        }

        return $attributes;
    }

    protected function processLocalizedCopy($item, string $field, $value, array $translations, string $suffix = '')
    {
        $isLocalized = $this->isLocalizedField($item, $field);

        if ($isLocalized) {
            $localizedValue = $this->decodeLocalizedValue($value);

            if (is_array($localizedValue)) {
                foreach ($localizedValue as $locale => $val) {
                    if (is_string($val)) {
                        $copyText = $translations[$locale] ?? 'Copy';
                        $localizedValue[$locale] = $suffix
                            ? $val . $suffix
                            : $this->addCopySuffix($val, $copyText);
                    }
                }
                return $localizedValue;
            } elseif (is_string($value)) {
                $copyText = $translations[app()->getLocale()] ?? 'Copy';
                return $suffix ? $value . $suffix : $this->addCopySuffix($value, $copyText);
            }
        } else {
            // Non-localized
            if (is_string($value)) {
                $copyText = $translations[app()->getLocale()] ?? 'Copy';
                return $suffix ? $value . $suffix : $this->addCopySuffix($value, $copyText);
            } elseif (is_array($value)) {
                // If value is array but field is NOT localized according to casts (e.g. JSON), check if it looks like locale array
                // But for safety, we might just return it or try to process.
                // Original code assumed localization if array. Let's stick to safe string handling or simple array iteration.
                foreach ($value as $k => $v) {
                    if (is_string($v)) {
                        $copyText = $translations[$k] ?? 'Copy';
                        $value[$k] = $suffix ? $v . $suffix : $this->addCopySuffix($v, $copyText);
                    }
                }
                return $value;
            }
        }

        return $value;
    }

    protected function duplicateRelationships($originalItem, $newItem, array $validRelationships)
    {
        if (empty($validRelationships)) {
            return;
        }

        $relationshipsData = [];
        foreach ($validRelationships as $relationName) {
            if (!$originalItem->relationLoaded($relationName)) {
                continue;
            }

            $relation = $originalItem->$relationName;
            if ($relation instanceof \Illuminate\Database\Eloquent\Relations\BelongsToMany) {
                // Get IDs from pivot table
                $relationshipsData[$relationName] = $originalItem->$relationName()->pluck('id')->toArray();
            } elseif ($relation instanceof \Illuminate\Database\Eloquent\Relations\BelongsTo) {
                // Get foreign key value
                $foreignKey = $originalItem->$relationName()->getForeignKeyName();
                $relationshipsData[$relationName] = $originalItem->$foreignKey;
            }
        }

        if (!empty($relationshipsData)) {
            $this->syncRelationships($newItem, $relationshipsData);
        }

        // Load for response
        $newItem->load($validRelationships);
    }

    /**
     * Get route name for a given action
     *
     * @param string $action
     * @return string
     */
    protected function getRouteName(string $action): string
    {
        $modelBaseName = class_basename($this->model);

        // Convert PascalCase to kebab-case (e.g., PostCategory -> post-category)
        $modelName = \Illuminate\Support\Str::kebab($modelBaseName);

        // Pluralize and convert to kebab-case (e.g., post-category -> post-categories)
        $pluralName = \Illuminate\Support\Str::plural($modelName);

        $routeName = "{$pluralName}.{$action}";

        // Add admin prefix if not already present
        if (!str_starts_with($routeName, 'admin.')) {
            $routeName = "admin.{$routeName}";
        }

        return $routeName;
    }

    /**
     * Get views config from controller const views
     * Returns UI definitions (title, description, icon, fields, filters, sections, actions)
     *
     * @param string $action
     * @return array
     */
    /**
     * Get views config for a given action
     * Extracts UI definitions from controller const views and merges with model configs
     *
     * @param string $action
     * @return array
     */
    protected function getViewsConfig(string $action): array
    {
        $viewKey = in_array($action, ['show', 'create', 'edit']) ? 'form' : $action;
        $viewConfig = $this->getViewConfig($viewKey);
        $baseView = $this->getBaseView($viewKey);

        // Extract simple properties (title, description, icon)
        $views = array_filter([
            'title' => $baseView['title'] ?? null,
            'description' => $baseView['description'] ?? null,
            'icon' => $baseView['icon'] ?? null,
        ], fn($value) => $value !== null);

        // Process fields with auto-detection for index view
        if (isset($baseView['fields'])) {
            $views['fields'] = $viewKey === 'index'
                ? $this->processIndexFields($baseView['fields'])
                : $baseView['fields'];
        }

        // Handle filters: prefer viewConfig filters over baseView
        if (isset($baseView['filters']) || isset($viewConfig['filters'])) {
            $views['filters'] = $viewConfig['filters'] ?? $baseView['filters'];
        }

        // Handle sections: merge with model configs
        if (isset($baseView['sections'])) {
            $merged = $this->mergeFormFieldsWithModelConfigs(['sections' => $baseView['sections']]);
            $views['sections'] = $merged['sections'] ?? [];
        }

        // Handle actions: prefer viewConfig actions over baseView
        if (isset($viewConfig['actions']) || isset($baseView['actions'])) {
            $views['actions'] = $viewConfig['actions'] ?? $baseView['actions'];
        }

        return $views;
    }

    /**
     * Process index fields to auto-detect type from model casts
     * Auto-adds type config for datetime/date fields
     *
     * @param array $fields
     * @return array
     */
    protected function processIndexFields(array $fields): array
    {
        if (!isset($this->model) || empty($fields)) {
            return $fields;
        }

        $modelInstance = new $this->model;
        $casts = $modelInstance->getCasts();
        $tableName = $modelInstance->getTable();

        return array_map(function ($field) use ($casts, $tableName) {
            // Keep already configured fields as-is
            if (is_array($field)) {
                return $field;
            }

            // Detect field type from casts or database schema
            $fieldConfig = $this->detectFieldType($field, $casts, $tableName);

            return $fieldConfig ?? $field;
        }, $fields);
    }

    /**
     * Detect field type from model casts or database column type
     *
     * @param string $fieldName
     * @param array $casts
     * @param string $tableName
     * @return array|null
     */
    /**
     * Detect field type from model casts or database column type
     *
     * @param string $fieldName
     * @param array $casts
     * @param string $tableName
     * @return array|null
     */
    protected function detectFieldType(string $fieldName, array $casts, string $tableName): ?array
    {
        // Priority 1: Check model casts
        if (isset($casts[$fieldName])) {
            $castType = !empty($casts[$fieldName]) ? class_basename($casts[$fieldName]) : null;

            $fieldConfig = match (true) {
                // Special Casts
                $castType === 'FileMedia' => [
                    'name' => $fieldName,
                    'type' => 'string',
                    'ui' => Str::plural($fieldName) === $fieldName ? 'attachments' : 'attachment'
                ],
                $castType === 'Localization' => ['name' => $fieldName, 'type' => 'string', 'ui' => 'text'],

                // Standard Casts
                $castType === 'boolean' || $castType === 'bool' => ['name' => $fieldName, 'type' => 'boolean', 'ui' => 'switch'],
                in_array($castType, ['integer', 'int']) => $this->detectIntegerFieldType($fieldName),
                in_array($castType, ['real', 'float', 'double', 'decimal']) => ['name' => $fieldName, 'type' => 'number', 'ui' => 'number'],
                in_array($castType, ['datetime', 'date', 'timestamp']) => ['name' => $fieldName, 'type' => 'date', 'ui' => 'date'],
                in_array($castType, ['array', 'json', 'object', 'collection']) => ['name' => $fieldName, 'type' => 'json', 'ui' => 'code'],
                $castType === 'string' => ['name' => $fieldName, 'type' => 'string', 'ui' => 'text'],

                default => null
            };

            if ($fieldConfig !== null) {
                $fieldConfig['size'] = $this->getDefaultFieldWidth($fieldConfig['ui'] ?? $fieldConfig['type'], $fieldName);
                return $fieldConfig;
            }
        }

        // Priority 2: Check database column type
        if (Schema::hasColumn($tableName, $fieldName)) {
            $columnType = Schema::getColumnType($tableName, $fieldName);

            $fieldConfig = match ($columnType) {
                'boolean', 'bool' => ['name' => $fieldName, 'type' => 'boolean', 'ui' => 'switch'],
                'datetime', 'date', 'timestamp' => ['name' => $fieldName, 'type' => 'date', 'ui' => 'date'],
                'enum' => ['name' => $fieldName, 'type' => 'string', 'ui' => 'badge'],
                'integer', 'bigint', 'smallint', 'tinyint' => $fieldConfig = $columnType === 'tinyint' && $fieldName === 'is_active' // heuristic for boolean
                    ? ['name' => $fieldName, 'type' => 'boolean', 'ui' => 'switch']
                    : $this->detectIntegerFieldType($fieldName),
                'decimal', 'float', 'double' => ['name' => $fieldName, 'type' => 'number', 'ui' => 'number'],
                'json' => ['name' => $fieldName, 'type' => 'json', 'ui' => 'code'],
                'text', 'mediumtext', 'longtext' => ['name' => $fieldName, 'type' => 'string', 'ui' => 'textarea', 'size' => 300],
                'string', 'varchar', 'char' => ['name' => $fieldName, 'type' => 'string', 'ui' => 'text'],
                default => null
            };

            if ($fieldConfig !== null) {
                if (!isset($fieldConfig['size'])) {
                    $fieldConfig['size'] = $this->getDefaultFieldWidth($fieldConfig['type'], $fieldName);
                }
                return $fieldConfig;
            }
        }

        return null;
    }

    /**
     * Detect field type for integer columns based on field name
     *
     * @param string $fieldName
     * @return array
     */
    protected function detectIntegerFieldType(string $fieldName): array
    {
        // Check if it's an ID field
        if ($fieldName === 'id') {
            return ['name' => $fieldName, 'type' => 'integer', 'ui' => 'number', 'size' => 120];
        }

        if (str_ends_with($fieldName, '_id')) {
            return ['name' => $fieldName, 'type' => 'integer', 'ui' => 'number', 'size' => 80];
        }

        // Check for count/quantity fields
        if (str_contains($fieldName, 'count') || str_contains($fieldName, 'quantity') || str_contains($fieldName, 'total')) {
            return ['name' => $fieldName, 'type' => 'integer', 'ui' => 'number', 'size' => 100];
        }

        return ['name' => $fieldName, 'type' => 'integer', 'ui' => 'number'];
    }

    /**
     * Get default field width based on field type and name
     *
     * @param string $type
     * @param string $fieldName
     * @return int
     */
    protected function getDefaultFieldWidth(string $type, string $fieldName): int
    {
        return match ($type) {
            'date' => 150,
            'attachment' => 80,
            'attachments' => 120,
            'badge' => 120,
            'number' => str_ends_with($fieldName, '_id') ? 80 : 100,
            'text' => 200,
            default => 150
        };
    }

    /**
     * Get base view config from controller const views
     *
     * @param string $viewKey
     * @return array
     */
    protected function getBaseView(string $viewKey): array
    {
        $reflection = new \ReflectionClass($this);
        $controllerViews = $reflection->hasConstant('views')
            ? $reflection->getConstant('views')
            : [];

        return $controllerViews[$viewKey] ?? [];
    }

    /**
     * Get model configs from model $configs property or configs() method
     * Returns field configurations from model
     * Supports both property ($configs) and method (configs())
     *
     * @return array
     */
    protected function getModelConfigs(): array
    {
        if (!isset($this->model)) {
            return [];
        }

        $modelInstance = new $this->model;
        return $this->extractModelConfigs($modelInstance);
    }

    /**
     * Extract configs from model instance
     * Supports:
     * 1. Method: configs() (priority)
     * 2. Static property: static $configs
     * 3. Instance property: $configs (backward compatibility)
     *
     * @param mixed $modelInstance
     * @return array
     */
    protected function extractModelConfigs($modelInstance): array
    {
        // Try method first (configs())
        if (method_exists($modelInstance, 'configs')) {
            $configs = $modelInstance->configs();
            if (is_array($configs) && !empty($configs)) {
                return $configs;
            }
        }

        // Try static property (static $configs)
        $class = get_class($modelInstance);
        $reflection = new \ReflectionClass($class);
        if ($reflection->hasProperty('configs')) {
            $property = $reflection->getProperty('configs');
            if ($property->isStatic()) {
                $property->setAccessible(true);
                $configs = $property->getValue();
                if (is_array($configs) && !empty($configs)) {
                    return $configs;
                }
            }
        }

        // Fallback to instance property ($configs) - backward compatibility
        if (property_exists($modelInstance, 'configs') && !empty($modelInstance->configs)) {
            return $modelInstance->configs;
        }

        return [];
    }

    /**
     * Get validation rules from plugins.php config or model configs
     * Merges 'all' rules with action-specific rules (create/update)
     * Ưu tiên: plugins.php config > model $configs
     *
     * @param string $action The action name (create, update, delete, etc.)
     * @param mixed $id Optional ID for update actions (used in unique rules)
     * @return array Validation rules array
     */
    protected function getValidationRules(string $action, $id = null): array
    {
        if (!isset($this->model)) {
            return [];
        }

        $modelName = class_basename($this->model);
        $plugins = config('plugins', []);

        // First, try to get from plugins.php config
        $validationRules = $this->getValidationRulesFromPlugins($plugins, $modelName, $action, $id);

        // If no validation rules from plugins.php, generate from model configs
        if (empty($validationRules)) {
            $validationRules = $this->generateValidationRulesFromModel($action, $id);
        }

        return $validationRules;
    }

    /**
     * Get validation rules from plugins config
     *
     * @param array $plugins
     * @param string $modelName
     * @param string $action
     * @param mixed $id
     * @return array
     */
    protected function getValidationRulesFromPlugins(array $plugins, string $modelName, string $action, $id): array
    {
        foreach ($plugins as $plugin) {
            if (empty($plugin['enabled']) || !is_array($plugin['validation'] ?? null)) {
                continue;
            }

            $modelValidation = $this->findModelValidation($plugin['validation'], $modelName);
            if ($modelValidation === null) {
                continue;
            }

            $actionRules = $modelValidation[$action] ?? [];
            $allRules = $this->processAllRules($modelValidation['all'] ?? [], $actionRules);

            // Merge 'all' rules with action-specific rules (action rules take precedence)
            $validationRules = array_merge($allRules, $actionRules);

            // Process rules to handle dynamic values like $id
            if ($id !== null) {
                $validationRules = $this->processDynamicRules($validationRules, $id);
            }

            return $validationRules;
        }

        return [];
    }

    /**
     * Find model validation config from plugin validation
     *
     * @param array $validation
     * @param string $modelName
     * @return array|null
     */
    protected function findModelValidation(array $validation, string $modelName): ?array
    {
        // Try singular first (e.g., 'Admin')
        if (isset($validation[$modelName])) {
            return $validation[$modelName];
        }

        // Try plural (e.g., 'admins')
        $pluralKey = strtolower(\Illuminate\Support\Str::plural($modelName));
        if (isset($validation[$pluralKey])) {
            return $validation[$pluralKey];
        }

        // Try lowercase singular (e.g., 'admin')
        $singularKey = strtolower($modelName);
        if (isset($validation[$singularKey])) {
            return $validation[$singularKey];
        }

        return null;
    }

    /**
     * Process 'all' rules from validation config
     *
     * @param array $allFields
     * @param array $actionRules
     * @return array
     */
    protected function processAllRules(array $allFields, array $actionRules): array
    {
        if (empty($allFields)) {
            return [];
        }

        // Check if 'all' contains validation rules (associative array) or field names (indexed array)
        $isRules = !empty($allFields) && array_keys($allFields) !== range(0, count($allFields) - 1);

        if ($isRules) {
            // 'all' contains validation rules, return them
            return $allFields;
        }

        // 'all' contains field names, filter action rules to only include these fields
        if (empty($actionRules)) {
            return [];
        }

        $filteredRules = [];
        foreach ($allFields as $field) {
            // Handle wildcard fields like 'roles.*'
            if (str_ends_with($field, '.*')) {
                $baseField = str_replace('.*', '', $field);
                foreach ($actionRules as $key => $rule) {
                    if ($key === $field || str_starts_with($key, $baseField . '.')) {
                        $filteredRules[$key] = $rule;
                    }
                }
            } elseif (isset($actionRules[$field])) {
                $filteredRules[$field] = $actionRules[$field];
            }
        }

        return $filteredRules;
    }

    /**
     * Generate validation rules from model $configs property
     * Maps required, type, and other configs to validation rules
     *
     * @param string $action
     * @param mixed $id
     * @return array
     */
    protected function generateValidationRulesFromModel(string $action, $id = null): array
    {
        if (!isset($this->model)) {
            return [];
        }

        $modelInstance = new $this->model;
        $modelConfigs = $this->extractModelConfigs($modelInstance);

        if (empty($modelConfigs)) {
            return [];
        }
        $validationRules = [];

        foreach ($modelConfigs as $fieldName => $fieldConfig) {
            $config = $fieldConfig['config'] ?? [];
            $rules = [];

            // Map required from config
            if (isset($config['required']) && $config['required'] === true) {
                $rules[] = 'required';
            } else {
                $rules[] = 'nullable';
            }

            // Map min/max length
            if (isset($config['minLength'])) {
                $rules[] = 'min:' . $config['minLength'];
            }
            if (isset($config['maxLength'])) {
                $rules[] = 'max:' . $config['maxLength'];
            }

            // Map pattern/regex
            if (isset($config['pattern'])) {
                $rules[] = 'regex:' . $config['pattern'];
            }

            if (!empty($rules)) {
                $validationRules[$fieldName] = implode('|', $rules);
            }
        }

        // Process rules to handle dynamic values like $id
        if ($id !== null) {
            $validationRules = $this->processDynamicRules($validationRules, $id);
        }

        return $validationRules;
    }

    /**
     * Process validation rules to replace dynamic placeholders
     *
     * @param array $rules
     * @param mixed $id
     * @return array
     */
    protected function processDynamicRules(array $rules, $id): array
    {
        foreach ($rules as $field => $rule) {
            if (is_string($rule)) {
                $rules[$field] = str_replace('$id', $id, $rule);
            }
        }

        return $rules;
    }

    /**
     * Generate form config from model $configs property
     * Maps model configs to view form format
     *
     * @return array
     */
    protected function generateFormConfigFromModel(): array
    {
        if (!isset($this->model)) {
            return [];
        }

        $modelInstance = new $this->model;
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
            'description' => $this->getModelName() . ' details',
            'sections' => $sections,
        ];

        // Auto-generate actions if not provided
        $formConfig['actions'] = [
            'save' => [
                'name' => 'Save',
                'icon' => 'Save',
                'route' => $this->getRouteName('store'),
            ],
        ];

        return $formConfig;
    }

    /**
     * Process field config from model: parse validation, auto-detect source, resolve routes
     *
     * @param string $fieldName
     * @param array $fieldConfig
     * @param mixed $modelInstance
     * @return array
     */
    protected function processFieldConfigFromModel(string $fieldName, array $fieldConfig, $modelInstance): array
    {
        $type = $fieldConfig['type'] ?? 'text';
        $config = $fieldConfig['config'] ?? [];

        // Parse validation string to extract required
        $this->parseValidationToRequired($config);

        // Process query config and convert to source config
        $this->processQueryConfig($config, $modelInstance, $fieldName);

        // Auto-detect and generate source config for select fields with _id suffix
        $this->autoDetectSourceConfig($fieldName, $type, $config, $modelInstance);

        // Auto-resolve route in source config
        $config = $this->resolveRoutesInConfig($config, $fieldName, $modelInstance);

        return array_merge(['type' => $type], $config);
    }

    /**
     * Build field config for view from processed config
     *
     * @param string $fieldName
     * @param array $processedConfig
     * @return array
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
     * Dynamic check: first check config['sidebar'], then fallback to simple logic
     *
     * @param string $fieldName
     * @param array $processedConfig
     * @return bool
     */
    protected function isSidebarField(string $fieldName, array $processedConfig): bool
    {
        // Check if sidebar is explicitly set in config
        if (isset($processedConfig['sidebar'])) {
            return (bool) $processedConfig['sidebar'];
        }

        // Fallback: simple logic - select fields with _id suffix typically go to sidebar
        $type = $processedConfig['type'] ?? 'text';
        return str_contains($fieldName, '_id') && $type === 'select';
    }

    /**
     * Build form sections from main and sidebar fields
     *
     * @param array $mainFields
     * @param array $sidebarFields
     * @return array
     */
    protected function buildFormSections(array $mainFields, array $sidebarFields): array
    {
        $sections = [];

        if (!empty($mainFields)) {
            $sections['main'] = [[
                'header' => [
                    'title' => $this->getModelName() . ' Details',
                    'description' => $this->getModelName() . ' information',
                ],
                'fields' => $mainFields,
            ]];
        }

        if (!empty($sidebarFields)) {
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
     * Parse validation string to extract required and set in config
     *
     * @param array &$config
     * @return void
     */
    protected function parseValidationToRequired(array &$config): void
    {
        if (isset($config['validation']) && is_string($config['validation'])) {
            $config['required'] = $this->isRequiredFromValidation($config['validation']);
        }
    }

    /**
     * Process query config - keep query config as is, let frontend handle it
     * Only ensures collection is set (fallback to field name if not provided)
     *
     * @param array &$config
     * @param mixed $modelInstance
     * @param string|null $fieldName
     * @return void
     */
    protected function processQueryConfig(array &$config, $modelInstance, ?string $fieldName = null): void
    {
        if (!isset($config['query']) || !is_array($config['query'])) {
            return;
        }

        $query = $config['query'];

        if (!isset($query['collection']) && $fieldName) {
            $config['query']['collection'] = str_replace('_id', '', $fieldName);
        }
    }

    /**
     * Process query filters (keep $CURRENT_ID placeholder for frontend to replace)
     *
     * @param array $filters
     * @return array
     */
    protected function processQueryFilters(array $filters): array
    {
        // Format filters for API (convert to _and format)
        // Keep $CURRENT_ID placeholder - frontend will replace it
        if (!empty($filters)) {
            return ['_and' => $filters];
        }

        return [];
    }

    /**
     * Generate route name from collection name
     *
     * @param string $collection
     * @return string
     */
    protected function generateRouteFromCollection(string $collection): string
    {
        // Convert collection name to route (e.g., 'post' -> 'admin.posts.index')
        $pluralName = \Illuminate\Support\Str::plural($collection);
        return "admin.{$pluralName}.index";
    }

    /**
     * Detect label key from fields array
     *
     * @param array $fields
     * @return string
     */
    protected function detectLabelKey(array $fields): string
    {
        // Priority: title > name > id
        if (in_array('title', $fields)) {
            return 'title';
        }
        if (in_array('name', $fields)) {
            return 'name';
        }
        return 'id';
    }

    /**
     * Auto-detect and generate source config for select fields
     *
     * @param string $fieldName
     * @param string $type
     * @param array &$config
     * @param mixed $modelInstance
     * @return void
     */
    protected function autoDetectSourceConfig(string $fieldName, string $type, array &$config, $modelInstance): void
    {
        if ($type === 'select' && !isset($config['source'])) {
            $relationshipName = null;

            // Check for _id suffix (e.g., parent_id -> parent)
            if (str_ends_with($fieldName, '_id')) {
                $relationshipName = str_replace('_id', '', $fieldName);
            }
            // Check if field name matches a relationship method (e.g., parent -> parent)
            elseif (method_exists($modelInstance, $fieldName)) {
                $relationshipName = $fieldName;
            }

            if ($relationshipName) {
                $sourceConfig = $this->generateSourceFromRelationship($modelInstance, $relationshipName);
                if ($sourceConfig) {
                    $config['source'] = $sourceConfig;
                }
            }
        }
    }

    /**
     * Check if validation string contains required rule
     *
     * @param string $validationString
     * @return bool
     */
    protected function isRequiredFromValidation(string $validationString): bool
    {
        if (empty($validationString)) {
            return false;
        }

        $rules = explode('|', $validationString);

        foreach ($rules as $rule) {
            $rule = trim(strtolower($rule));
            if ($rule === 'required' || str_starts_with($rule, 'required:')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate label from field name
     * Converts snake_case to Title Case
     *
     * @param string $fieldName
     * @return string
     */
    protected function generateLabelFromFieldName(string $fieldName): string
    {
        // Remove _id suffix for better labels
        $cleanName = str_replace('_id', '', $fieldName);

        // Convert snake_case to Title Case
        $words = explode('_', $cleanName);
        $words = array_map('ucfirst', $words);

        return implode(' ', $words);
    }

    /**
     * Get model name for labels
     *
     * @return string
     */
    protected function getModelName(): string
    {
        if (!isset($this->model)) {
            return 'Item';
        }

        $modelName = class_basename($this->model);
        // Convert PascalCase to Title Case
        $modelName = preg_replace('/([a-z])([A-Z])/', '$1 $2', $modelName);

        return $modelName;
    }

    /**
     * Generate source config from relationship name
     *
     * @param mixed $modelInstance
     * @param string $relationshipName
     * @return array|null
     */
    protected function generateSourceFromRelationship($modelInstance, string $relationshipName): ?array
    {
        if (!method_exists($modelInstance, $relationshipName)) {
            return null;
        }

        try {
            $relation = $modelInstance->$relationshipName();
            if (!($relation instanceof \Illuminate\Database\Eloquent\Relations\Relation)) {
                return null;
            }

            // Get related model class
            $relatedModel = get_class($relation->getRelated());
            $currentModel = get_class($modelInstance);
            $relatedModelName = class_basename($relatedModel);

            // Generate route from related model name
            $routeName = $this->generateRouteFromModel($relatedModelName);

            // Auto-detect fields (id, name/title)
            $fields = ['id'];
            $labelKey = 'id';

            // Try to find name or title field
            $relatedInstance = new $relatedModel;
            $tableName = $relatedInstance->getTable();

            if (\Illuminate\Support\Facades\Schema::hasColumn($tableName, 'name')) {
                $fields[] = 'name';
                $labelKey = 'name';
            } elseif (\Illuminate\Support\Facades\Schema::hasColumn($tableName, 'title')) {
                $fields[] = 'title';
                $labelKey = 'title';
            }

            $params = [
                'fields' => $fields,
            ];

            // If relationship is self-referential and model has $type property, filter by type
            if ($relatedModel === $currentModel && property_exists($modelInstance, 'type')) {
                $type = $modelInstance::$type ?? null;
                if ($type) {
                    $params['filters'] = [
                        '_and' => [
                            'type' => [
                                '_eq' => $type,
                            ],
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
     *
     * @param string $modelName
     * @return string
     */
    protected function generateRouteFromModel(string $modelName): string
    {
        // Convert PascalCase to kebab-case (e.g., PostCategory -> post-category)
        $kebabName = \Illuminate\Support\Str::kebab($modelName);

        // Pluralize (e.g., post-category -> post-categories)
        $pluralName = \Illuminate\Support\Str::plural($kebabName);

        return "admin.{$pluralName}.index";
    }

    /**
     * Resolve routes in config to use current controller's route
     * Ưu tiên: controller views > model configs > auto-generated
     * Nếu model có parent, luôn dùng route của chính nó thay vì parent
     *
     * @param array $config
     * @param string $fieldName
     * @param mixed $modelInstance
     * @return array
     */
    protected function resolveRoutesInConfig(array $config, string $fieldName, $modelInstance = null): array
    {
        if (!isset($this->model)) {
            return $config;
        }

        // Handle source route in select fields
        if (isset($config['source']['route'])) {
            $sourceRoute = $config['source']['route'];

            // Check if route is defined in controller views (ưu tiên cao nhất)
            $controllerRoute = $this->getRouteFromControllerViews($fieldName);
            if ($controllerRoute) {
                $config['source']['route'] = $controllerRoute;
                return $config;
            }

            $currentRoutePrefix = $this->getRouteName('index');

            // Get parent model class if current model extends another
            $modelReflection = new \ReflectionClass($this->model);
            $parentClass = $modelReflection->getParentClass();

            // Nếu có parent, luôn dùng route của chính model hiện tại (ví dụ: admin.category.index)
            if ($parentClass && $parentClass->getName() !== 'Illuminate\Database\Eloquent\Model') {
                $config['source']['route'] = $currentRoutePrefix;
            }
        }

        return $config;
    }


    /**
     * Merge form fields (string array) with model configs
     * Convert field names to full field configs with model configs
     *
     * @param array $config
     * @return array
     */
    protected function mergeFormFieldsWithModelConfigs(array $config): array
    {
        if (!isset($this->model) || !isset($config['sections'])) {
            return $config;
        }

        $modelInstance = new $this->model;
        $modelConfigs = $this->extractModelConfigs($modelInstance);

        if (empty($modelConfigs)) {
            return $config;
        }

        // Process each section
        foreach ($config['sections'] as $sectionKey => $sectionItems) {
            if (!is_array($sectionItems)) {
                continue;
            }

            foreach ($sectionItems as $index => $sectionItem) {
                if (!is_array($sectionItem) || !isset($sectionItem['fields'])) {
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
     *
     * @param string $fieldName
     * @param array $modelConfigs
     * @param mixed $modelInstance
     * @return array
     */
    protected function processStringField(string $fieldName, array $modelConfigs, $modelInstance): array
    {
        if (!isset($modelConfigs[$fieldName])) {
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
     *
     * @param array $field
     * @param array $modelConfigs
     * @param mixed $modelInstance
     * @return array
     */
    protected function processArrayField(array $field, array $modelConfigs, $modelInstance): array
    {
        if (!isset($field['name']) || !isset($modelConfigs[$field['name']])) {
            return $field;
        }

        $fieldName = $field['name'];
        $fieldConfig = $modelConfigs[$fieldName];
        $processedConfig = $this->processFieldConfigFromModel($fieldName, $fieldConfig, $modelInstance);

        // Merge: model configs (base) + user config (override)
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
     * Validate relationships before eager loading
     * Filters out relationships that cannot be eager loaded
     *
     * @param array $relationships
     * @return array
     */
    protected function validateRelationships(array $relationships): array
    {
        if (!isset($this->model) || empty($relationships)) {
            return [];
        }

        $validRelationships = [];
        $modelInstance = new $this->model;

        foreach ($relationships as $relationshipName) {
            if (!method_exists($modelInstance, $relationshipName)) {
                continue;
            }

            try {
                $reflection = new \ReflectionMethod($modelInstance, $relationshipName);
                if (!$reflection->isPublic() || $reflection->getNumberOfRequiredParameters() > 0) {
                    continue;
                }

                $relation = $modelInstance->$relationshipName();
                if ($relation instanceof \Illuminate\Database\Eloquent\Relations\Relation) {
                    // Skip morphTo relationships without parameters
                    if ($relation instanceof \Illuminate\Database\Eloquent\Relations\MorphTo) {
                        continue;
                    }
                    $validRelationships[] = $relationshipName;
                }
            } catch (\Exception $e) {
                // Skip relationships that throw exceptions
                continue;
            }
        }

        return $validRelationships;
    }

    /**
     * Map field names from form config to database column names
     * Handles cases like 'parent' -> 'parent_id' when field name matches a relationship
     *
     * @param array $fieldNames
     * @return array
     */
    protected function mapFieldsToDatabaseColumns(array $fieldNames): array
    {
        if (!isset($this->model)) {
            return $fieldNames;
        }

        $modelInstance = new $this->model;
        $fillable = $modelInstance->getFillable();
        $tableName = $modelInstance->getTable();
        $mappedFields = [];

        foreach ($fieldNames as $fieldName) {
            // Handle JSON/Dot-notation fields
            if (str_contains($fieldName, '.')) {
                $baseField = $this->resolveBaseColumnFromDotNotation($modelInstance, $fieldName);
                if ($baseField && !in_array($baseField, $mappedFields)) {
                    $mappedFields[] = $baseField;
                }
                continue;
            }

            // Direct match in fillable or database
            if ($this->isDirectColumn($fieldName, $fillable, $tableName)) {
                $mappedFields[] = $fieldName;
                continue;
            }

            // Resolve from relationship (e.g. 'parent' -> 'parent_id')
            $relColumn = $this->resolveColumnFromRelationship($modelInstance, $fieldName, $fillable, $tableName);
            if ($relColumn) {
                $mappedFields[] = $relColumn;
                continue;
            }

            // Check if {field}_id exists
            $fieldId = $fieldName . '_id';
            if ($this->isDirectColumn($fieldId, $fillable, $tableName)) {
                $mappedFields[] = $fieldId;
                continue;
            }
        }

        return $mappedFields;
    }

    protected function resolveBaseColumnFromDotNotation($modelInstance, string $fieldName): ?string
    {
        $firstPart = explode('.', $fieldName)[0];
        $casts = $modelInstance->getCasts();

        // Check if first part is a JSON column
        $isJsonColumn = isset($casts[$firstPart]) &&
            (in_array($casts[$firstPart], ['array', 'json', 'object', 'collection']) ||
                class_exists($casts[$firstPart]));

        return $isJsonColumn ? $firstPart : null;
    }

    protected function isDirectColumn(string $field, array $fillable, string $tableName): bool
    {
        return in_array($field, $fillable) || \Illuminate\Support\Facades\Schema::hasColumn($tableName, $field);
    }

    protected function resolveColumnFromRelationship($modelInstance, string $fieldName, array $fillable, string $tableName): ?string
    {
        if (!method_exists($modelInstance, $fieldName)) {
            // Try camelCase
            $camelCaseName = \Illuminate\Support\Str::camel($fieldName);
            if ($camelCaseName !== $fieldName && method_exists($modelInstance, $camelCaseName)) {
                return $this->resolveColumnFromRelationship($modelInstance, $camelCaseName, $fillable, $tableName);
            }
            return null;
        }

        try {
            $relationship = $modelInstance->$fieldName();
            if ($relationship instanceof \Illuminate\Database\Eloquent\Relations\Relation) {
                if (
                    $relationship instanceof \Illuminate\Database\Eloquent\Relations\MorphOne ||
                    $relationship instanceof \Illuminate\Database\Eloquent\Relations\MorphMany ||
                    $relationship instanceof \Illuminate\Database\Eloquent\Relations\MorphTo
                ) {
                    return null;
                }

                $foreignKey = $relationship->getForeignKeyName();
                $columnName = str_contains($foreignKey, '.') ? explode('.', $foreignKey)[1] : $foreignKey;

                if ($this->isDirectColumn($columnName, $fillable, $tableName)) {
                    return $columnName;
                }
            }
        } catch (\Exception $e) {
            // ignore
        }
        return null;
    }

    /**
     * Get fields from view config (only fields declared in controller views)
     * Extracts field names from the processed view config sections
     *
     * @param array $viewConfig
     * @return array
     */
    protected function getFieldsFromViewConfig(array $viewConfig): array
    {
        if (!isset($viewConfig['sections']) || !is_array($viewConfig['sections'])) {
            return [];
        }

        $fieldNames = [];
        foreach ($viewConfig['sections'] as $sectionItems) {
            if (!is_array($sectionItems)) {
                continue;
            }

            foreach ($sectionItems as $sectionItem) {
                if (!isset($sectionItem['fields']) || !is_array($sectionItem['fields'])) {
                    continue;
                }

                foreach ($sectionItem['fields'] as $field) {
                    $fieldName = is_string($field) ? $field : ($field['name'] ?? null);
                    if ($fieldName) {
                        $fieldNames[] = $fieldName;
                    }
                }
            }
        }

        return array_unique($fieldNames);
    }

    /**
     * Load item for form with optimized field selection
     *
     * @param mixed $id
     * @return \Illuminate\Database\Eloquent\Model
     */
    protected function loadItemForForm($id)
    {
        $query = $this->model::query();

        // Load relationships first before applying select
        $relationships = $this->getFormRelationships();
        $validRelationships = !empty($relationships)
            ? $this->validateRelationships($relationships)
            : [];

        if (!empty($validRelationships)) {
            $query->with($validRelationships);
        }

        // Get fields from view config (only fields declared in controller views)
        $views = $this->getViewsConfig('form');
        $formFields = $this->getFieldsFromViewConfig($views);

        if (!empty($formFields)) {
            $dbFields = $this->mapFieldsToDatabaseColumns($formFields);
            $baseFields = ['id', 'created_at', 'updated_at'];

            // Add required fields for BaseTerm models (taxonomies)
            $modelInstance = new $this->model;
            if ($modelInstance instanceof \PS0132E282\Core\Base\BaseTerm) {
                $baseFields = array_merge($baseFields, ['slug', 'type']);
            }

            $fields = array_unique(array_merge($baseFields, $dbFields));

            if (!empty($validRelationships)) {
                $foreignKeys = $this->getForeignKeysForRelationships($validRelationships);
                $fields = array_unique(array_merge($fields, $foreignKeys));
            }

            $query->select($fields);
        }

        $item = $query->findOrFail($id);

        // Ensure relationships are loaded if they weren't eager loaded
        if (!empty($validRelationships)) {
            $item->loadMissing($validRelationships);
        }

        return $item;
    }

    /**
     * Get foreign keys for BelongsTo relationships
     * This ensures that when using select(), foreign keys are included so relationships can be loaded
     *
     * @param array $relationships
     * @return array
     */
    protected function getForeignKeysForRelationships(array $relationships): array
    {
        if (!isset($this->model) || empty($relationships)) {
            return [];
        }

        $foreignKeys = [];
        $modelInstance = new $this->model;
        $tableName = $modelInstance->getTable();

        foreach ($relationships as $relationshipName) {
            if (!method_exists($modelInstance, $relationshipName)) {
                continue;
            }

            try {
                $relation = $modelInstance->$relationshipName();
                if ($relation instanceof \Illuminate\Database\Eloquent\Relations\BelongsTo) {
                    $foreignKey = $relation->getForeignKeyName();
                    // Extract column name from foreign key (e.g., 'categories.parent_id' -> 'parent_id')
                    $columnName = str_contains($foreignKey, '.')
                        ? explode('.', $foreignKey)[1]
                        : $foreignKey;

                    // Only add if it's a valid column in the table
                    if (\Illuminate\Support\Facades\Schema::hasColumn($tableName, $columnName)) {
                        $foreignKeys[] = $columnName;
                    }
                }
            } catch (\Exception $e) {
                // Skip relationships that throw exceptions
                continue;
            }
        }

        return $foreignKeys;
    }

    /**
     * Get available locales from config or default
     *
     * @return array
     */
    protected function getAvailableLocales(): array
    {
        $locales = config('app.available_locales');

        if (is_array($locales) && !empty($locales)) {
            return $locales;
        }

        // Fallback to default locales
        return ['en', 'vi'];
    }

    /**
     * Check if a field uses Localization cast
     *
     * @param \Illuminate\Database\Eloquent\Model $model
     * @param string $field
     * @return bool
     */
    protected function isLocalizedField($model, string $field): bool
    {
        if (!isset($this->model)) {
            return false;
        }

        $casts = $model->getCasts();
        if (!isset($casts[$field])) {
            return false;
        }

        $cast = $casts[$field];
        return $cast === \PS0132E282\Core\Cats\Localization::class
            || is_subclass_of($cast, \PS0132E282\Core\Cats\Localization::class);
    }

    /**
     * Decode localized value from JSON string to array
     *
     * @param mixed $value
     * @return array|mixed
     */
    protected function decodeLocalizedValue($value)
    {
        // If already array, return as is
        if (is_array($value)) {
            return $value;
        }

        // If string, try to decode JSON
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
            // If not valid JSON, return as is
            return $value;
        }

        return $value;
    }

    /**
     * Add copy suffix to a value, incrementing number if already has copy suffix
     *
     * @param string $value
     * @param string $copyText
     * @return string
     */
    protected function addCopySuffix(string $value, string $copyText): string
    {
        $pattern = '/\s*\((' . preg_quote($copyText, '/') . ')(\s+(\d+))?\)\s*$/i';

        if (preg_match($pattern, $value, $matches)) {
            $currentNumber = isset($matches[3]) && is_numeric($matches[3]) ? (int)$matches[3] : 1;
            $nextNumber = $currentNumber + 1;

            $baseValue = preg_replace($pattern, '', $value);

            return $baseValue . ' (' . $copyText . ' ' . $nextNumber . ')';
        }

        return $value . ' (' . $copyText . ')';
    }
}

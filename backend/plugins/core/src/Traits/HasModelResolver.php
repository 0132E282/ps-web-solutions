<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use ReflectionClass;

trait HasModelResolver
{
    /**
     * Cached model instance to avoid repeated instantiation
     */
    private ?object $cachedModelInstance = null;

    /**
     * Cached ReflectionClass for the model
     */
    private ?ReflectionClass $cachedModelReflection = null;

    /**
     * Check if the controller has a model set
     */
    protected function hasModel(): bool
    {
        return isset($this->model) && $this->model !== null;
    }

    /**
     * Get or create a cached model instance
     */
    protected function resolveModelInstance(): ?object
    {
        if (! $this->hasModel()) {
            return null;
        }

        return $this->cachedModelInstance ??= new $this->model;
    }

    /**
     * Get or create a cached ReflectionClass for the model
     */
    protected function resolveModelReflection(): ?ReflectionClass
    {
        if (! $this->hasModel()) {
            return null;
        }

        return $this->cachedModelReflection ??= new ReflectionClass($this->model);
    }

    /**
     * Get route name for a given action
     */
    protected function getRouteName(string $action): string
    {
        $modelBaseName = class_basename($this->model);
        $modelName = Str::kebab($modelBaseName);
        $pluralName = Str::plural($modelName);

        $routeName = "{$pluralName}.{$action}";

        if (! str_starts_with($routeName, 'admin.')) {
            $routeName = "admin.{$routeName}";
        }

        return $routeName;
    }

    /**
     * Get base view config from controller const views
     */
    protected function getBaseView(string $viewKey): array
    {
        $reflection = new ReflectionClass($this);
        $controllerViews = $reflection->hasConstant('views')
            ? $reflection->getConstant('views')
            : [];

        return $controllerViews[$viewKey] ?? [];
    }

    /**
     * Get model configs from model $configs property or configs() method
     */
    protected function getModelConfigs(): array
    {
        $modelInstance = $this->resolveModelInstance();
        if (! $modelInstance) {
            return [];
        }

        return $this->extractModelConfigs($modelInstance);
    }

    /**
     * Extract configs from model instance
     * Supports: method configs(), static property $configs, instance property $configs
     */
    protected function extractModelConfigs($modelInstance): array
    {
        if (method_exists($modelInstance, 'configs')) {
            $configs = $modelInstance->configs();
            if (is_array($configs) && ! empty($configs)) {
                return $configs;
            }
        }

        $class = get_class($modelInstance);
        $reflection = new ReflectionClass($class);
        if ($reflection->hasProperty('configs')) {
            $property = $reflection->getProperty('configs');
            if ($property->isStatic()) {
                $property->setAccessible(true);
                $configs = $property->getValue();
                if (is_array($configs) && ! empty($configs)) {
                    return $configs;
                }
            }
        }

        if (property_exists($modelInstance, 'configs') && ! empty($modelInstance->configs)) {
            return $modelInstance->configs;
        }

        return [];
    }

    /**
     * Validate relationships before eager loading
     */
    protected function validateRelationships(array $relationships): array
    {
        if (! $this->hasModel() || empty($relationships)) {
            return [];
        }

        $validRelationships = [];
        $modelInstance = $this->resolveModelInstance();

        foreach ($relationships as $relationshipName) {
            if (! method_exists($modelInstance, $relationshipName)) {
                continue;
            }

            try {
                $reflection = new \ReflectionMethod($modelInstance, $relationshipName);
                if (! $reflection->isPublic() || $reflection->getNumberOfRequiredParameters() > 0) {
                    continue;
                }

                $relation = $modelInstance->$relationshipName();
                if ($relation instanceof \Illuminate\Database\Eloquent\Relations\Relation) {
                    if ($relation instanceof \Illuminate\Database\Eloquent\Relations\MorphTo) {
                        continue;
                    }
                    $validRelationships[] = $relationshipName;
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        return $validRelationships;
    }

    /**
     * Map field names from form config to database column names
     */
    protected function mapFieldsToDatabaseColumns(array $fieldNames): array
    {
        $modelInstance = $this->resolveModelInstance();
        if (! $modelInstance) {
            return $fieldNames;
        }

        $fillable = $modelInstance->getFillable();
        $tableName = $modelInstance->getTable();
        $mappedFields = [];

        foreach ($fieldNames as $fieldName) {
            if (str_contains($fieldName, '.')) {
                $baseField = $this->resolveBaseColumnFromDotNotation($modelInstance, $fieldName);
                if ($baseField && ! in_array($baseField, $mappedFields)) {
                    $mappedFields[] = $baseField;
                }

                continue;
            }

            if ($this->isDirectColumn($fieldName, $fillable, $tableName)) {
                $mappedFields[] = $fieldName;

                continue;
            }

            $relColumn = $this->resolveColumnFromRelationship($modelInstance, $fieldName, $fillable, $tableName);
            if ($relColumn) {
                $mappedFields[] = $relColumn;

                continue;
            }

            $fieldId = $fieldName.'_id';
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

        $isJsonColumn = isset($casts[$firstPart]) &&
            (in_array($casts[$firstPart], ['array', 'json', 'object', 'collection']) ||
                class_exists($casts[$firstPart]));

        return $isJsonColumn ? $firstPart : null;
    }

    protected function isDirectColumn(string $field, array $fillable, string $tableName): bool
    {
        return in_array($field, $fillable) || Schema::hasColumn($tableName, $field);
    }

    protected function resolveColumnFromRelationship($modelInstance, string $fieldName, array $fillable, string $tableName): ?string
    {
        if (! method_exists($modelInstance, $fieldName)) {
            $camelCaseName = Str::camel($fieldName);
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
     * Get fields from view config sections
     */
    protected function getFieldsFromViewConfig(array $viewConfig): array
    {
        if (! isset($viewConfig['sections']) || ! is_array($viewConfig['sections'])) {
            return [];
        }

        $fieldNames = [];
        foreach ($viewConfig['sections'] as $sectionItems) {
            if (! is_array($sectionItems)) {
                continue;
            }

            foreach ($sectionItems as $sectionItem) {
                if (! isset($sectionItem['fields']) || ! is_array($sectionItem['fields'])) {
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
     */
    protected function loadItemForForm($id)
    {
        $query = $this->model::query();

        $requestFieldsStr = $this->getFieldsFromRequest();
        $formFields = $requestFieldsStr ? explode(',', $requestFieldsStr) : [];
        if (empty($formFields)) {
            $views = $this->getViewsConfig('form');
            $formFields = $this->getFieldsFromViewConfig($views);
        }

        $relationships = $this->getFormRelationships();

        if ($requestFieldsStr) {
            $modelInstance = $this->resolveModelInstance();
            foreach ($formFields as $fieldName) {
                if (! $this->isDatabaseColumn($modelInstance, $fieldName)) {
                    $this->checkAndAddRelationMethod($fieldName, $relationships, $modelInstance);
                }
            }
        }

        $validRelationships = ! empty($relationships)
            ? $this->validateRelationships($relationships)
            : [];

        if (! empty($validRelationships)) {
            $query->with($validRelationships);
        }

        if (! empty($formFields)) {
            $dbFields = $this->mapFieldsToDatabaseColumns($formFields);
            $baseFields = ['id', 'created_at', 'updated_at'];

            $modelInstance = $this->resolveModelInstance();
            if ($modelInstance instanceof \PS0132E282\Core\Base\BaseTerm) {
                $baseFields = array_merge($baseFields, ['slug', 'type']);
            }

            $fields = array_unique(array_merge($baseFields, $dbFields));

            if (! empty($validRelationships)) {
                $foreignKeys = $this->getForeignKeysForRelationships($validRelationships);
                $fields = array_unique(array_merge($fields, $foreignKeys));
            }

            $query->select($fields);
        }

        $item = $query->findOrFail($id);

        if (! empty($validRelationships)) {
            $item->loadMissing($validRelationships);
        }

        return $item;
    }

    /**
     * Get foreign keys for BelongsTo relationships
     */
    protected function getForeignKeysForRelationships(array $relationships): array
    {
        if (! $this->hasModel() || empty($relationships)) {
            return [];
        }

        $foreignKeys = [];
        $modelInstance = $this->resolveModelInstance();
        $tableName = $modelInstance->getTable();

        foreach ($relationships as $relationshipName) {
            if (! method_exists($modelInstance, $relationshipName)) {
                continue;
            }

            try {
                $relation = $modelInstance->$relationshipName();
                if ($relation instanceof \Illuminate\Database\Eloquent\Relations\BelongsTo) {
                    $foreignKey = $relation->getForeignKeyName();
                    $columnName = str_contains($foreignKey, '.')
                        ? explode('.', $foreignKey)[1]
                        : $foreignKey;

                    if (Schema::hasColumn($tableName, $columnName)) {
                        $foreignKeys[] = $columnName;
                    }
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        return $foreignKeys;
    }

    /**
     * Process query filters (keep $CURRENT_ID placeholder for frontend to replace)
     */
    protected function processQueryFilters(array $filters): array
    {
        if (! empty($filters)) {
            return ['_and' => $filters];
        }

        return [];
    }
}

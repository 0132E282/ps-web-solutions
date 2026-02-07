<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

trait FieldTrait
{
    protected function parseFields(?string $fieldsString = null, ?string $modelClass = null): array
    {
        if (empty($fieldsString)) {
            return [
                'columns' => ['*'],
                'relationships' => [],
            ];
        }

        $fields = array_map('trim', explode(',', $fieldsString));
        $columns = [];
        $relationships = [];
        $modelInstance = null;

        // Get model instance if model class is provided
        if ($modelClass && class_exists($modelClass)) {
            $modelInstance = new $modelClass;
        }

        foreach ($fields as $field) {
            if (empty($field)) {
                continue;
            }

            // Check if field contains relationship (has dot)
            if (str_contains($field, '.')) {
                $parts = explode('.', $field);
                $firstPart = $parts[0];

                // Check if first part is a JSON column (not a relationship)
                $isJsonColumn = false;
                if ($modelInstance) {
                    $tableName = $modelInstance->getTable();
                    $isColumn = Schema::hasColumn($tableName, $firstPart);

                    if ($isColumn) {
                        // Check if it's a JSON cast
                        $casts = $modelInstance->getCasts();
                        if (isset($casts[$firstPart]) &&
                            (in_array($casts[$firstPart], ['array', 'json', 'object', 'collection']) ||
                             class_exists($casts[$firstPart]))) {
                            $isJsonColumn = true;
                        }
                    }
                }

                if ($isJsonColumn) {
                    // This is a JSON column access, add base column only
                    if (! in_array($firstPart, $columns)) {
                        $columns[] = $firstPart;
                    }
                } else {
                    // This is a relationship access
                    $relationshipPath = array_slice($parts, 0, -1);
                    $column = end($parts);

                    // Build relationship path (e.g., "user.profile" -> ["user", "profile"])
                    $relationshipKey = implode('.', $relationshipPath);

                    if (! isset($relationships[$relationshipKey])) {
                        $relationships[$relationshipKey] = [];
                    }

                    // Add column to relationship if not already added
                    if (! in_array($column, $relationships[$relationshipKey])) {
                        $relationships[$relationshipKey][] = $column;
                    }
                }
            } else {
                // Check if field is a relationship (not a database column)
                $isRelationship = false;

                if ($modelInstance) {
                    // Check if field exists as a column in the database
                    $tableName = $modelInstance->getTable();
                    $isColumn = Schema::hasColumn($tableName, $field);

                    // If not a column, check if it's a relationship method
                    if (! $isColumn && method_exists($modelInstance, $field)) {
                        try {
                            // Use reflection to check if method exists and is public
                            $reflection = new \ReflectionMethod($modelInstance, $field);
                            if ($reflection->isPublic() && $reflection->getNumberOfRequiredParameters() === 0) {
                                $relation = $modelInstance->$field();
                                // Check if it returns a relation instance
                                if ($relation instanceof \Illuminate\Database\Eloquent\Relations\Relation) {
                                    $isRelationship = true;
                                    // Add as relationship to eager load (without specific columns)
                                    if (! isset($relationships[$field])) {
                                        $relationships[$field] = [];
                                    }
                                }
                            }
                        } catch (\Exception $e) {
                            // If method throws exception, it's not a relationship
                            $isRelationship = false;
                        } catch (\Error $e) {
                            // If method throws error, it's not a relationship
                            $isRelationship = false;
                        }
                    }
                }

                // Only add to columns if it's not a relationship
                if (! $isRelationship) {
                    // Direct column - but double check it's actually a column
                    if ($modelInstance) {
                        $tableName = $modelInstance->getTable();
                        $isColumn = Schema::hasColumn($tableName, $field);
                        if ($isColumn) {
                            $columns[] = $field;
                        }
                        // If not a column and not a relationship, skip it
                    } else {
                        // No model instance, assume it's a column
                        $columns[] = $field;
                    }
                }
            }
        }

        // If no columns specified, use all columns
        if (empty($columns)) {
            $columns = ['*'];
        }

        return [
            'columns' => $columns,
            'relationships' => $relationships,
        ];
    }

    /**
     * Get columns for main model
     *
     * @param  string|null  $modelClass  Optional model class to check for relationships
     */
    protected function getColumns(?string $fieldsString = null, ?string $modelClass = null): array
    {
        return $this->parseFields($fieldsString, $modelClass)['columns'];
    }

    /**
     * Get relationships to eager load
     *
     * @param  string|null  $modelClass  Optional model class to check for relationships
     */
    protected function getRelationships(?string $fieldsString = null, ?string $modelClass = null): array
    {
        $parsed = $this->parseFields($fieldsString, $modelClass);
        $relationships = [];

        // Convert relationship paths to eager load format
        // e.g., "user.profile" -> ["user" => ["profile" => ["columns"]]]
        foreach ($parsed['relationships'] as $path => $columns) {
            $parts = explode('.', $path);

            if (count($parts) === 1) {
                if (empty($columns)) {
                    $relationships[$path] = function ($query) {
                        // Load all columns, no need to specify
                    };
                } else {
                    $relationships[$path] = function ($query) use ($columns) {
                        $query->select(array_merge(['id'], $columns));
                    };
                }
            } else {
                // Nested relationship: "user.profile"
                $firstRelation = array_shift($parts);
                $nestedPath = implode('.', $parts);

                if (! isset($relationships[$firstRelation])) {
                    $relationships[$firstRelation] = function ($query) use ($nestedPath, $columns) {
                        $query->with([$nestedPath => function ($q) use ($columns) {
                            if (empty($columns)) {
                                // Load all columns
                            } else {
                                $q->select(array_merge(['id'], $columns));
                            }
                        }]);
                    };
                } else {
                    // Merge with existing relationship
                    $existing = $relationships[$firstRelation];
                    $relationships[$firstRelation] = function ($query) use ($existing, $nestedPath, $columns) {
                        $existing($query);
                        $query->with([$nestedPath => function ($q) use ($columns) {
                            if (empty($columns)) {
                                // Load all columns
                            } else {
                                $q->select(array_merge(['id'], $columns));
                            }
                        }]);
                    };
                }
            }
        }

        return array_keys($relationships);
    }

    /**
     * Apply fields to query builder
     */
    protected function applyFields(Builder $query, ?string $fieldsString = null): Builder
    {
        // Get model class from query
        $modelClass = get_class($query->getModel());
        $parsed = $this->parseFields($fieldsString, $modelClass);

        // Select columns
        $query->select($parsed['columns']);

        // Build nested relationship structure
        $relationshipStructure = [];

        foreach ($parsed['relationships'] as $path => $columns) {
            $parts = explode('.', $path);
            $this->buildRelationshipStructure($relationshipStructure, $parts, $columns);
        }

        // Apply relationships to query
        $this->applyRelationshipStructure($query, $relationshipStructure);

        return $query;
    }

    /**
     * Build nested relationship structure
     */
    protected function buildRelationshipStructure(array &$structure, array $parts, array $columns): void
    {
        if (empty($parts)) {
            return;
        }

        $relation = array_shift($parts);

        if (! isset($structure[$relation])) {
            $structure[$relation] = [
                'columns' => [],
                'nested' => [],
            ];
        }

        if (empty($parts)) {
            // This is the final relationship, add columns
            $structure[$relation]['columns'] = array_unique(
                array_merge($structure[$relation]['columns'], $columns)
            );
        } else {
            // Nested relationship
            if (! isset($structure[$relation]['nested'])) {
                $structure[$relation]['nested'] = [];
            }
            $this->buildRelationshipStructure($structure[$relation]['nested'], $parts, $columns);
        }
    }

    /**
     * Apply relationship structure to query
     */
    protected function applyRelationshipStructure(Builder $query, array $structure): void
    {
        $withClosures = [];

        foreach ($structure as $relation => $config) {
            $withClosures[$relation] = function ($q) use ($config) {
                // Select columns for this relationship only if specified
                if (! empty($config['columns'])) {
                    $q->select(array_merge(['id'], $config['columns']));
                }
                // If no columns specified, load all columns (default behavior)

                // Apply nested relationships recursively
                if (! empty($config['nested'])) {
                    $this->applyNestedRelationships($q, $config['nested']);
                }
            };
        }

        if (! empty($withClosures)) {
            $query->with($withClosures);
        }
    }

    /**
     * Apply nested relationships recursively
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     */
    protected function applyNestedRelationships($query, array $nestedStructure): void
    {
        $nestedWith = [];

        foreach ($nestedStructure as $nestedRelation => $nestedConfig) {
            $nestedWith[$nestedRelation] = function ($nestedQ) use ($nestedConfig) {
                // Select columns for this nested relationship
                if (! empty($nestedConfig['columns'])) {
                    $nestedQ->select(array_merge(['id'], $nestedConfig['columns']));
                }

                // Recursively apply deeper nested relationships
                if (! empty($nestedConfig['nested'])) {
                    $this->applyNestedRelationships($nestedQ, $nestedConfig['nested']);
                }
            };
        }

        if (! empty($nestedWith)) {
            $query->with($nestedWith);
        }
    }

    /**
     * Get fields from request
     */
    protected function getFieldsFromRequest(?\Illuminate\Http\Request $request = null): ?string
    {
        $request = $request ?? request();
        $fields = $request->input('fields');

        if ($fields === null) {
            return null;
        }

        // Convert array to comma-separated string if needed
        if (is_array($fields)) {
            return implode(',', $fields);
        }

        // Return as string
        return (string) $fields;
    }

    /**
     * Apply fields from request to query
     */
    protected function applyFieldsFromRequest(Builder $query, ?\Illuminate\Http\Request $request = null): Builder
    {
        $fieldsString = $this->getFieldsFromRequest($request);

        return $this->applyFields($query, $fieldsString);
    }

    /**
     * Get nested value from model (supports JSON columns)
     *
     * @param  mixed  $model
     * @param  string  $field  Field with dot notation (e.g., "property.type", "user.profile.name")
     * @param  mixed  $default
     * @return mixed
     */
    protected function getNestedFieldValue($model, string $field, $default = null)
    {
        if (! str_contains($field, '.')) {
            // Simple field access
            return data_get($model, $field, $default);
        }

        $parts = explode('.', $field);
        $firstPart = $parts[0];

        // Check if first part is a JSON column
        if (is_object($model) && method_exists($model, 'getCasts')) {
            $casts = $model->getCasts();
            $isJsonColumn = isset($casts[$firstPart]) &&
                (in_array($casts[$firstPart], ['array', 'json', 'object', 'collection']) ||
                 class_exists($casts[$firstPart]));

            if ($isJsonColumn) {
                // Access JSON column value
                $jsonData = $model->$firstPart ?? [];
                $nestedKey = implode('.', array_slice($parts, 1));

                return data_get($jsonData, $nestedKey, $default);
            }
        }

        // Use Laravel's data_get for relationship access
        return data_get($model, $field, $default);
    }
}

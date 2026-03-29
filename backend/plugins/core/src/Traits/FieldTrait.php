<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Str;

trait FieldTrait
{
    protected array $selectedFields = [];

    /**
     * Apply fields selection and eager loading to the query
     */
    protected function applyFields(Builder $query, array|string|null $fields = []): Builder
    {
        if (is_string($fields)) {
            $fields = array_map('trim', explode(',', $fields));
        }

        if (empty($fields)) {
            return $query;
        }

        $this->selectedFields = [
            'columns' => [],
            'relations' => []
        ];

        $table = $query->getModel()->getTable();

        foreach ($fields as $field) {
            $this->processField($query, $field, $this->selectedFields);
        }

        // If no columns were explicitly selected, select all from main table
        if (empty($this->selectedFields['columns'])) {
            $this->selectedFields['columns'] = ["{$table}.*"];
        }

        // Always ensure ID is selected for the main table
        if (!in_array("{$table}.id", $this->selectedFields['columns']) && !in_array("{$table}.*", $this->selectedFields['columns'])) {
            $this->selectedFields['columns'][] = "{$table}.id";
        }

        // Apply relationship eager loading with nested selections
        foreach ($this->selectedFields['relations'] as $relation => $nestedFields) {
            if (method_exists($query->getModel(), $relation)) {
                $relationInstance = $query->getModel()->{$relation}();

                // For BelongsTo, ensure foreign key is in main select
                if ($relationInstance instanceof BelongsTo) {
                    $foreignKey = $relationInstance->getForeignKeyName();
                    if (!in_array("{$table}.{$foreignKey}", $this->selectedFields['columns']) && !in_array("{$table}.*", $this->selectedFields['columns'])) {
                        $this->selectedFields['columns'][] = "{$table}.{$foreignKey}";
                    }
                }

                if ($relationInstance instanceof MorphTo) {
                    $query->with($relation); // MorphTo is hard to select specific columns for easily
                } else {
                    $query->with([$relation => function ($q) use ($nestedFields) {
                        $this->applyNestedFields($q, $nestedFields);
                    }]);
                }
            }
        }

        $query->select($this->selectedFields['columns']);

        return $query;
    }

    /**
     * Recursive field processing (Pattern from jam-nocode-platform)
     */
    protected function processField(Builder $query, string $field, array &$selectedFields): void
    {
        $table = $query->getModel()->getTable();

        if (Str::contains($field, '.')) {
            $parts = explode('.', $field);
            $relation = array_shift($parts);
            $nestedField = implode('.', $parts);

            if (method_exists($query->getModel(), $relation)) {
                if (!isset($selectedFields['relations'][$relation])) {
                    $selectedFields['relations'][$relation] = ['columns' => [], 'relations' => []];
                }

                $relationInstance = $query->getModel()->{$relation}();
                if ($relationInstance instanceof Relation) {
                    $this->processField($relationInstance->getModel()->newQuery(), $nestedField, $selectedFields['relations'][$relation]);
                }
            }
        } else {
            // Check for JSON column access
            if (Str::contains($field, '->')) {
                $baseField = explode('->', $field)[0];
                if (!in_array("{$table}.{$baseField}", $selectedFields['columns'])) {
                    $selectedFields['columns'][] = "{$table}.{$baseField}";
                }
            } else {
                // If it's a relation name itself, select all for that relation later
                if (method_exists($query->getModel(), $field) && !Str::is($field, $table)) {
                    if (!isset($selectedFields['relations'][$field])) {
                        $selectedFields['relations'][$field] = ['columns' => [], 'relations' => []];
                    }
                } else {
                    // Regular column
                    $selectedFields['columns'][] = "{$table}.{$field}";
                }
            }
        }
    }

    /**
     * Apply nested selections to eager loaded models
     */
    protected function applyNestedFields($query, array $nestedFields): void
    {
        $relatedTable = $query->getModel()->getTable();
        $relatedKey = $query->getModel()->getKeyName();

        $columns = $nestedFields['columns'];

        // Ensure key is selected
        if (!empty($columns) && !in_array("{$relatedTable}.{$relatedKey}", $columns) && !in_array("{$relatedTable}.*", $columns)) {
            $columns[] = "{$relatedTable}.{$relatedKey}";
        }

        // Apply nested relations
        foreach ($nestedFields['relations'] as $relation => $subFields) {
            if (method_exists($query->getModel(), $relation)) {
                $relationInstance = $query->getModel()->{$relation}();
                
                // For BelongsTo in nested relation, ensure foreign key is selected
                if ($relationInstance instanceof BelongsTo) {
                    $foreignKey = $relationInstance->getForeignKeyName();
                    if (!empty($columns) && !in_array("{$relatedTable}.{$foreignKey}", $columns) && !in_array("{$relatedTable}.*", $columns)) {
                        $columns[] = "{$relatedTable}.{$foreignKey}";
                    }
                }

                $query->with([$relation => function ($q) use ($subFields) {
                    $this->applyNestedFields($q, $subFields);
                }]);
            }
        }

        if (!empty($columns)) {
            $query->select($columns);
        }
    }

    /**
     * Get columns for main model
     */
    protected function getColumns(?string $fieldsString = null, ?string $modelClass = null): array
    {
        return $this->parseFields($fieldsString, $modelClass)['columns'];
    }

    /**
     * Get relationships to eager load
     */
    protected function getRelationships(?string $fieldsString = null, ?string $modelClass = null): array
    {
        return $this->parseFields($fieldsString, $modelClass)['relationships'];
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

        if (is_array($fields)) {
            return implode(',', $fields);
        }

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
     * Compatibility wrapper for original parseFields
     */
    protected function parseFields(?string $fieldsString = null, ?string $modelClass = null): array
    {
        if (empty($fieldsString)) {
            return ['columns' => ['*'], 'relationships' => []];
        }

        $fields = array_map('trim', explode(',', $fieldsString));
        $columns = [];
        $relationships = [];

        foreach ($fields as $field) {
            if (str_contains($field, '.')) {
                $parts = explode('.', $field);
                $rel = $parts[0];
                if (!in_array($rel, $relationships)) $relationships[] = $rel;
            } else {
                $columns[] = $field;
            }
        }

        return [
            'columns' => empty($columns) ? ['*'] : $columns,
            'relationships' => $relationships,
        ];
    }

    /**
     * Get nested value from model (supports JSON columns)
     */
    protected function getNestedFieldValue($model, string $field, $default = null)
    {
        return data_get($model, $field, $default);
    }
}

<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

trait SortTrait
{
    /**
     * Apply multiple sorts to the query builder
     *
     * @param Builder $query
     * @param array $sorts Array of ['column' => string, 'order' => 'asc'|'desc', 'includes' => array|null]
     * @param array $options {
     *     @var array $allowed Allowed columns
     *     @var array $custom Custom SQL fragments
     *     @var array $relations Relation mappings
     * }
     * @return Builder
     */
    protected function applySorts(Builder $query, array $sorts = [], array $options = []): Builder
    {
        if (empty($sorts)) {
            // Default sort if none provided
            $defaultBy = $options['default_by'] ?? 'id';
            $defaultOrder = $options['default_order'] ?? 'desc';
            $sorts = [['column' => $defaultBy, 'order' => $defaultOrder]];
        }

        // Group sorts by priority (pattern from jam-nocode-platform)
        $groupedSorts = [
            'position' => [],
            'id' => [],
            'other' => []
        ];

        foreach ($sorts as $sort) {
            $column = $sort['column'] ?? '';
            match (true) {
                $column === 'position' => $groupedSorts['position'][] = $sort,
                $column === 'id' => $groupedSorts['id'][] = $sort,
                default => $groupedSorts['other'][] = $sort
            };
        }

        // Apply sorts in priority order
        foreach (array_merge(...array_values($groupedSorts)) as $sort) {
            $this->applySingleSort($query, $sort, $options);
        }

        return $query;
    }

    /**
     * Apply a single sort condition
     */
    protected function applySingleSort(Builder $query, array $sort, array $options = []): void
    {
        $column = $sort['column'] ?? 'id';
        $order = strtolower($sort['order'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $includes = $sort['includes'] ?? null;
        $allowed = $options['allowed'] ?? [];
        $custom = $options['custom'] ?? [];

        // 1. Inclusion Sort (Specific ID list)
        if (!empty($includes)) {
            $this->applyInclusionSort($query, $column, $includes);
            return;
        }

        // 2. Custom/Conditional Sort
        if (isset($custom[$column])) {
            $query->orderByRaw("({$custom[$column]}) {$order}");
            return;
        }

        // 3. Relationship Sort
        if (str_contains($column, '.')) {
            $this->applyRelationSort($query, $column, $order);
            return;
        }

        // 4. Standard Sort
        if (empty($allowed) || in_array($column, $allowed, true)) {
            // Basic sanitization
            if (preg_match('/^[a-zA-Z0-9_]+$/', $column)) {
                $tableName = $query->getModel()->getTable();
                
                // Handle position with NULLs last
                if ($column === 'position') {
                    $query->orderByRaw("{$tableName}.{$column} IS NULL, {$tableName}.{$column} {$order}");
                } else {
                    $query->orderByRaw("{$tableName}.{$column} {$order}");
                }
            }
        }
    }

    /**
     * Apply relationship sorting using subqueries (matches user preference for raw SQL)
     */
    protected function applyRelationSort(Builder $query, string $column, string $order): void
    {
        [$relationName, $relationColumn] = explode('.', $column, 2);
        
        try {
            $model = $query->getModel();
            if (method_exists($model, $relationName)) {
                $relation = $model->$relationName();
                $relatedTable = $relation->getRelated()->getTable();
                $foreignKey = $relation->getForeignKeyName();
                $ownerKey = $relation->getOwnerKeyName();
                $mainTable = $model->getTable();

                $subquery = "(SELECT {$relationColumn} FROM {$relatedTable} WHERE {$relatedTable}.{$ownerKey} = {$mainTable}.{$foreignKey} LIMIT 1)";
                $query->orderByRaw("{$subquery} {$order}");
            }
        } catch (\Exception $e) {
            // Fallback to basic string if relationship logic fails
            if (preg_match('/^[a-zA-Z0-9_\.]+$/', $column)) {
                $query->orderByRaw("{$column} {$order}");
            }
        }
    }

    /**
     * Apply inclusion sort using FIELD or CASE
     */
    protected function applyInclusionSort(Builder $query, string $column, array $includes): void
    {
        $ids = array_filter(array_map('intval', $includes));
        if (empty($ids)) return;

        $tableName = $query->getModel()->getTable();
        $idsString = implode(',', $ids);
        
        // MySQL FIELD() approach
        $query->orderByRaw("FIELD({$tableName}.{$column}, {$idsString})");
    }

    /**
     * Compatibility wrapper for original applySort method
     */
    protected function applySort($query, ?Request $request = null, array $options = [])
    {
        $request = $request ?? request();
        $sorts = [];

        // 1. Handle sort_by and sort_order (Old style)
        if ($sortBy = $request->get('sort_by')) {
            $sorts[] = [
                'column' => $sortBy,
                'order' => $request->get('sort_order', 'desc'),
                'includes' => ($sortIds = $request->get('sort_ids')) ? explode(',', $sortIds) : null
            ];
        }

        // 2. Handle sorts and order arrays (New/Specific style)
        $requestSorts = $request->get('sorts');
        if (is_array($requestSorts)) {
            $requestOrders = $request->get('order', []);
            foreach ($requestSorts as $index => $sort) {
                if (is_array($sort) && isset($sort['column'])) {
                    $column = $sort['column'];
                    // Get order from either the sort object itself OR a companion order array (handles user's specific case)
                    $order = $sort['order'] ?? $requestOrders[$index]['order'] ?? $requestOrders[$index] ?? 'desc';
                    
                    $sorts[] = [
                        'column' => $column,
                        'order' => $order,
                    ];
                } elseif (is_string($sort)) {
                    // Handle ['id', 'name'] with ['desc', 'asc'] zipping if needed
                    $sorts[] = [
                        'column' => $sort,
                        'order' => $requestOrders[$index] ?? 'desc',
                    ];
                }
            }
        }

        return $this->applySorts($query, $sorts, $options);
    }
}

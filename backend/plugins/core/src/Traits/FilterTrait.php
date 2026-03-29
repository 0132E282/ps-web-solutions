<?php

namespace PS0132E282\Core\Traits;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

trait FilterTrait
{
    /**
     * Apply filters from request or array to query builder
     */
    protected function applyFilters(Builder $query, array|Request|null $filters = null): Builder
    {
        if ($filters instanceof Request) {
            $filters = $filters->input('filters', []);
        } elseif ($filters === null) {
            $filters = request()->input('filters', []);
        }

        if (empty($filters)) {
            return $query;
        }

        foreach ($filters as $key => $value) {
            // 1. Handle Logical Operators (_and, _or)
            if ($this->isLogicalOperator($key)) {
                $query->where(function ($q) use ($key, $value) {
                    foreach ($value as $subKey => $subValue) {
                        $method = ($key === '_or') ? 'orWhere' : 'where';
                        $q->$method(function ($subQuery) use ($subKey, $subValue) {
                            $this->applyFilters($subQuery, is_numeric($subKey) ? $subValue : [$subKey => $subValue]);
                        });
                    }
                });
            } 
            // 2. Handle Eager Loading with Filters (_with)
            elseif ($key === '_with') {
                foreach ($value as $relation => $subFilters) {
                    $relationName = Str::camel($relation);
                    if (method_exists($query->getModel(), $relationName)) {
                        $query->with([$relationName => function ($q) use ($subFilters) {
                            // Extract special params like _limit and _sort if needed
                            $this->applyFilters($q, $subFilters);
                        }]);
                    }
                }
            }
            // 3. Handle Relationship Filtering (whereHas)
            elseif (method_exists($query->getModel(), Str::camel($key)) && is_array($value)) {
                $query->whereHas(Str::camel($key), function ($q) use ($value) {
                    $this->applyFilters($q, $value);
                });
            }
            // 4. Handle Standard Column Filtering
            else {
                if (is_array($value) && !array_is_list($value)) {
                    foreach ($value as $operator => $val) {
                        if ($this->isOperator($operator)) {
                            $this->applyFilter($query, $key, $operator, $val);
                        } else {
                            // Nested property or something else
                            $this->applyFilters($query, [$key.'.'.$operator => $val]);
                        }
                    }
                } else {
                    // Default to equal if not an array of operators
                    $this->applyFilter($query, $key, '_eq', $value);
                }
            }
        }

        return $query;
    }

    /**
     * Apply a single filter condition
     */
    protected function applyFilter(Builder $query, string $field, string $operator, $value): void
    {
        $value = $this->resolveDynamicVariables($value);

        // Handle dot notation for relationships in simple fields
        if (str_contains($field, '.')) {
            [$relation, $col] = explode('.', $field, 2);
            $query->whereHas(Str::camel($relation), function ($q) use ($col, $operator, $value) {
                $this->applyFilter($q, $col, $operator, $value);
            });
            return;
        }

        $table = $query->getModel()->getTable();
        $qualifiedField = str_contains($field, '.') ? $field : "{$table}.{$field}";

        switch (strtolower($operator)) {
            case '_eq':
                $query->where($qualifiedField, '=', $value);
                break;
            case '_ne':
            case '_neq':
                $query->where($qualifiedField, '!=', $value);
                break;
            case '_gt':
                $query->where($qualifiedField, '>', $value);
                break;
            case '_gte':
                $query->where($qualifiedField, '>=', $value);
                break;
            case '_lt':
                $query->where($qualifiedField, '<', $value);
                break;
            case '_lte':
                $query->where($qualifiedField, '<=', $value);
                break;
            case '_like':
                $query->where($qualifiedField, 'LIKE', '%' . $value . '%');
                break;
            case '_nlike':
                $query->where($qualifiedField, 'NOT LIKE', '%' . $value . '%');
                break;
            case '_startswith':
                $query->where($qualifiedField, 'LIKE', $value . '%');
                break;
            case '_endswith':
                $query->where($qualifiedField, 'LIKE', '%' . $value);
                break;
            case '_in':
                $query->whereIn($qualifiedField, (array) $value);
                break;
            case '_nin':
            case '_not_in':
                $query->whereNotIn($qualifiedField, (array) $value);
                break;
            case '_between':
                $query->whereBetween($qualifiedField, (array) $value);
                break;
            case '_is_null':
                $query->whereNull($qualifiedField);
                break;
            case '_is_not_null':
                $query->whereNotNull($qualifiedField);
                break;
            case '_date_eq':
                $query->whereDate($qualifiedField, '=', $value);
                break;
            default:
                $query->where($qualifiedField, '=', $value);
        }
    }

    protected function isLogicalOperator(string $key): bool
    {
        return in_array($key, ['_and', '_or']);
    }

    protected function isOperator(string $key): bool
    {
        return str_starts_with($key, '_');
    }

    protected function resolveDynamicVariables($value)
    {
        if (is_string($value)) {
            if ($value === '$CURRENT_USER') {
                return Auth::id();
            }
            if ($value === '$NOW') {
                return Carbon::now();
            }
            if ($value === '$TODAY') {
                return Carbon::today()->toDateString();
            }
            
            if (in_array(strtolower($value), ['true', 'false'], true)) {
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            }
        }
        return $value;
    }

    /**
     * Compatibility wrapper for original applyFilterCondition
     */
    protected function applyFilterCondition(Builder $query, string $field, string $operator, $value): void
    {
        $this->applyFilter($query, $field, $operator, $value);
    }

    /**
     * Compatibility wrapper for original applyRelationshipFilter
     */
    protected function applyRelationshipFilter(Builder $query, string $field, string $operator, $value): void
    {
        $this->applyFilter($query, $field, $operator, $value);
    }

    protected function getFilter(string $key): array
    {
        return match ($key) {
            'search' => [
                'key' => 'search',
                'label' => 'Tìm kiếm',
                'type' => 'text',
            ],
            default => []
        };
    }
}

<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait FilterTrait
{
    /**
     * Apply filters from request to query builder
     * Supports filters[_and][field][operator]=value structure
     * 
     * @param Builder $query
     * @param Request|null $request
     * @return Builder
     */
    protected function applyFilters(Builder $query, ?Request $request = null): Builder
    {
        $request = $request ?? request();
        $filters = $request->input('filters', []);
        
        if (empty($filters)) {
            return $query;
        }
        
        // Handle filters[_and] structure
        if (isset($filters['_and']) && is_array($filters['_and'])) {
            $andFilters = $filters['_and'];
            
            foreach ($andFilters as $field => $operators) {
                if (!is_array($operators)) {
                    continue;
                }
                
                foreach ($operators as $operator => $value) {
                    $this->applyFilterCondition($query, $field, $operator, $value);
                }
            }
        }
        
        return $query;
    }
    
    /**
     * Apply a single filter condition to query
     * 
     * @param Builder $query
     * @param string $field
     * @param string $operator
     * @param mixed $value
     * @return void
     */
    protected function applyFilterCondition(Builder $query, string $field, string $operator, $value): void
    {
        if ($value === null || $value === '') {
            return;
        }
        
        // Check if field is a relationship (contains dot, e.g., "roles.name")
        if (strpos($field, '.') !== false) {
            $this->applyRelationshipFilter($query, $field, $operator, $value);
            return;
        }
        
        // Regular field filter
        switch ($operator) {
            case '_eq':
                // Equal
                $query->where($field, '=', $value);
                break;
                
            case '_ne':
                // Not equal
                $query->where($field, '!=', $value);
                break;
                
            case '_like':
                // Like (partial match)
                $query->where($field, 'LIKE', "%{$value}%");
                break;
                
            case '_not_like':
                // Not like
                $query->where($field, 'NOT LIKE', "%{$value}%");
                break;
                
            case '_gt':
                // Greater than
                $query->where($field, '>', $value);
                break;
                
            case '_gte':
                // Greater than or equal
                $query->where($field, '>=', $value);
                break;
                
            case '_lt':
                // Less than
                $query->where($field, '<', $value);
                break;
                
            case '_lte':
                // Less than or equal
                $query->where($field, '<=', $value);
                break;
                
            case '_in':
                // In array
                if (is_array($value)) {
                    $query->whereIn($field, $value);
                } else {
                    $query->whereIn($field, [$value]);
                }
                break;
                
            case '_not_in':
                // Not in array
                if (is_array($value)) {
                    $query->whereNotIn($field, $value);
                } else {
                    $query->whereNotIn($field, [$value]);
                }
                break;
                
            case '_between':
                // Between two values
                if (is_array($value) && count($value) === 2) {
                    $query->whereBetween($field, $value);
                }
                break;
                
            case '_is_null':
                // Is null
                if ($value) {
                    $query->whereNull($field);
                }
                break;
                
            case '_is_not_null':
                // Is not null
                if ($value) {
                    $query->whereNotNull($field);
                }
                break;
                
            default:
                // Default: use equal operator
                $query->where($field, '=', $value);
        }
    }
    
    /**
     * Apply filter condition on relationship
     * Supports nested relationships like "roles.name" or "user.profile.email"
     * 
     * @param Builder $query
     * @param string $field Field path like "roles.name" or "user.profile.email"
     * @param string $operator
     * @param mixed $value
     * @return void
     */
    protected function applyRelationshipFilter(Builder $query, string $field, string $operator, $value): void
    {
        $parts = explode('.', $field);
        
        if (count($parts) < 2) {
            // Invalid relationship path, fallback to regular field
            $this->applyFilterCondition($query, $field, $operator, $value);
            return;
        }
        
        // Get the relationship name (first part) and remaining path
        $relationshipName = array_shift($parts);
        $remainingPath = implode('.', $parts);
        
        // Check if remaining path is still a relationship (nested)
        // If it contains more dots, it's a nested relationship
        if (strpos($remainingPath, '.') !== false) {
            // Nested relationship: recursively apply whereHas
            $query->whereHas($relationshipName, function ($relationQuery) use ($remainingPath, $operator, $value) {
                $this->applyRelationshipFilter($relationQuery, $remainingPath, $operator, $value);
            });
        } else {
            // Final column in relationship
            $columnName = $remainingPath;
            
            // Apply whereHas for relationship
            $query->whereHas($relationshipName, function ($relationQuery) use ($columnName, $operator, $value) {
                switch ($operator) {
                    case '_eq':
                        $relationQuery->where($columnName, '=', $value);
                        break;
                        
                    case '_ne':
                        $relationQuery->where($columnName, '!=', $value);
                        break;
                        
                    case '_like':
                        $relationQuery->where($columnName, 'LIKE', "%{$value}%");
                        break;
                        
                    case '_not_like':
                        $relationQuery->where($columnName, 'NOT LIKE', "%{$value}%");
                        break;
                        
                    case '_gt':
                        $relationQuery->where($columnName, '>', $value);
                        break;
                        
                    case '_gte':
                        $relationQuery->where($columnName, '>=', $value);
                        break;
                        
                    case '_lt':
                        $relationQuery->where($columnName, '<', $value);
                        break;
                        
                    case '_lte':
                        $relationQuery->where($columnName, '<=', $value);
                        break;
                        
                    case '_in':
                        if (is_array($value)) {
                            $relationQuery->whereIn($columnName, $value);
                        } else {
                            $relationQuery->whereIn($columnName, [$value]);
                        }
                        break;
                        
                    case '_not_in':
                        if (is_array($value)) {
                            $relationQuery->whereNotIn($columnName, $value);
                        } else {
                            $relationQuery->whereNotIn($columnName, [$value]);
                        }
                        break;
                        
                    case '_between':
                        if (is_array($value) && count($value) === 2) {
                            $relationQuery->whereBetween($columnName, $value);
                        }
                        break;
                        
                    case '_is_null':
                        if ($value) {
                            $relationQuery->whereNull($columnName);
                        }
                        break;
                        
                    case '_is_not_null':
                        if ($value) {
                            $relationQuery->whereNotNull($columnName);
                        }
                        break;
                        
                    default:
                        $relationQuery->where($columnName, '=', $value);
                }
            });
        }
    }
}


<?php

namespace PS0132E282\Core\Traits;

/**
 * Trait for resolving dashboard statistics.
 */
trait HasDashboardStats
{
    /**
     * Resolve dashboard stat queries and attach computed `value` to each item.
     */
    protected function resolveDashboardStats(array $dashboards): array
    {
        return array_map(function (array $dashboard) {
            $queryConfig = $dashboard['query'] ?? null;
            if (! $queryConfig) {
                return $dashboard;
            }

            try {
                $collection = $queryConfig['collection'] ?? null;
                $modelClass = $collection
                    ? model_class(type: $collection)
                    : $this->model;

                if (! $modelClass || ! class_exists($modelClass)) {
                    $dashboard['value'] = 0;

                    return $dashboard;
                }

                $builder = $modelClass::query();

                foreach ($queryConfig['filters'] ?? [] as $field => $condition) {
                    if (is_array($condition)) {
                        $op = array_key_first($condition);
                        $val = $condition[$op];
                        $builder = match ($op) {
                            '_eq'  => $builder->where($field, $val),
                            '_neq' => $builder->where($field, '!=', $val),
                            '_gt'  => $builder->where($field, '>', $val),
                            '_lt'  => $builder->where($field, '<', $val),
                            '_gte' => $builder->where($field, '>=', $val),
                            '_lte' => $builder->where($field, '<=', $val),
                            '_in'  => $builder->whereIn($field, (array) $val),
                            '_nin' => $builder->whereNotIn($field, (array) $val),
                            default => $builder,
                        };
                    } else {
                        $builder = $builder->where($field, $condition);
                    }
                }

                $aggregate = $queryConfig['loaditems'] ?? 'count';
                $aggField  = $queryConfig['agg_field'] ?? 'id';

                $dashboard['value'] = match (true) {
                    str_starts_with((string) $aggregate, 'count') => $builder->count(),
                    $aggregate === 'sum'                          => $builder->sum($aggField),
                    $aggregate === 'avg'                          => round((float) $builder->avg($aggField), 2),
                    $aggregate === 'max'                          => $builder->max($aggField),
                    $aggregate === 'min'                          => $builder->min($aggField),
                    default                                       => $builder->count(),
                };
            } catch (\Throwable) {
                $dashboard['value'] = 0;
            }

            return $dashboard;
        }, $dashboards);
    }
}

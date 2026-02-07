<?php

namespace PS0132E282\Core\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

class ItemLoader
{
    public static function load(
        Builder $query,
        ?callable $applyFieldsCallback = null,
        array $options = []
    ) {
        $paginate = $options['paginate'] ?? request()->boolean('paginate', true);
        $tree = $options['tree'] ?? request()->boolean('tree', false);
        $limit = $options['limit'] ?? request()->input('limit');
        $page = $options['page'] ?? request()->input('page', 1);
        $parentColumn = $options['parentColumn'] ?? 'parent_id';

        if ($applyFieldsCallback) {
            $applyFieldsCallback($query);
        }

        if ($tree) {
            if (!$paginate) {
                $limit = -1;
            }
            self::ensureTreeColumns($query, $parentColumn);
            self::applyTreeQuery($query, $parentColumn);
        }

        if ($paginate) {
            return $query->paginate($limit ? (int)$limit : 20, ['*'], 'page', $page);
        }

        if ($limit == -1 || $tree) {
            $items = $query->get();
            return $tree ? self::buildTree($items, $parentColumn) : $items;
        }

        if ($limit && $limit > 0) {
            $query->limit($limit);
        }

        $items = $query->get();
        return $tree ? self::buildTree($items, $parentColumn) : $items;
    }

    public static function applyTreeQuery(Builder $query, string $parentColumn = 'parent_id'): Builder
    {
        return $query->orderByRaw("CASE WHEN {$parentColumn} IS NULL THEN 0 ELSE 1 END");
    }

    protected static function ensureTreeColumns(Builder $query, string $parentColumn): void
    {
        $selectedColumns = $query->getQuery()->columns;
        if (!$selectedColumns || in_array('*', $selectedColumns)) {
            return;
        }

        $model = $query->getModel();
        $tableName = $model->getTable();
        $requiredColumns = ['id', $parentColumn];
        $columnsToAdd = [];

        foreach ($requiredColumns as $col) {
            $found = false;
            foreach ($selectedColumns as $selectedCol) {
                if ($selectedCol === $col
                    || $selectedCol === "{$tableName}.{$col}"
                    || (is_string($selectedCol) && preg_match('/\b' . preg_quote($col, '/') . '\b/i', $selectedCol))
                ) {
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $columnsToAdd[] = $col;
            }
        }

        if (!empty($columnsToAdd)) {
            $query->addSelect($columnsToAdd);
        }
    }

    public static function buildTree(Collection $items, string $parentColumn = 'parent_id'): array
    {
        $itemsByParent = [];
        foreach ($items as $item) {
            $parentId = $item->{$parentColumn} ?? null;
            $itemsByParent[$parentId][] = $item;
        }

        $rootItems = $itemsByParent[0] ?? ($itemsByParent[null] ?? []);
        $tree = [];
        foreach ($rootItems as $rootItem) {
            $tree[] = self::buildTreeNode($rootItem, $itemsByParent, $parentColumn);
        }

        return $tree;
    }

    protected static function buildTreeNode(Model $item, array $itemsByParent, string $parentColumn): array
    {
        $node = $item->toArray();
        $itemId = $item->id;

        if (isset($itemsByParent[$itemId])) {
            $node['children'] = [];
            foreach ($itemsByParent[$itemId] as $child) {
                $node['children'][] = self::buildTreeNode($child, $itemsByParent, $parentColumn);
            }
        }

        return $node;
    }
}


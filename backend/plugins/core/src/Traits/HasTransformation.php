<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Trait for transforming items for view.
 */
trait HasTransformation
{
    /**
     * Transform items based on view configuration (handle dot notation fields).
     */
    protected function transformItemsForView($items, string $action): array
    {
        $dotFields = $this->resolveDotFieldsForAction($action);

        $rawItems = $this->extractItemCollection($items);

        if (empty($dotFields)) {
            return $rawItems->map(fn($item) => $this->itemToArray($item))->values()->toArray();
        }

        return $rawItems->map(fn($item) => $this->applyDotFields($item, $dotFields))->values()->toArray();
    }

    /**
     * Resolve fields with dot notation for a given action.
     */
    protected function resolveDotFieldsForAction(string $action): array
    {
        $viewConfig = $this->getViewConfig($action);
        $fields = $this->extractFieldNames($viewConfig['config']['fields'] ?? $viewConfig['fields'] ?? []);

        return array_values(array_filter($fields, fn($f) => str_contains($f, '.')));
    }

    /**
     * Extract collection of items from paginator, collection, or array.
     */
    protected function extractItemCollection($items): Collection
    {
        if ($items instanceof LengthAwarePaginator) {
            return collect($items->items());
        }

        return $items instanceof Collection ? $items : collect($items);
    }

    /**
     * Convert a single item to plain array.
     */
    protected function itemToArray($item): array
    {
        return $item instanceof Model ? $item->toArray() : (array) $item;
    }

    /**
     * Apply dot-notation field resolution to a single item.
     */
    protected function applyDotFields($item, array $dotFields): array
    {
        $data = $this->itemToArray($item);

        foreach ($dotFields as $field) {
            if (isset($data[$field])) {
                continue;
            }

            $data[$field] = $this->resolveFieldValue($item, $field);
        }

        return $data;
    }

    /**
     * Resolve value for a dot-notation field from a model or array item.
     */
    protected function resolveFieldValue($item, string $field): mixed
    {
        $value = data_get($item, $field);

        if ($value !== null) {
            return $value;
        }

        $parts    = explode('.', $field);
        $relation = $parts[0];

        // * Check if the relation is a loaded collection (BelongsToMany / HasMany)
        $relationData = $item->{$relation} ?? null;

        if ($relationData instanceof Collection || is_array($relationData)) {
            $property = implode('.', array_slice($parts, 1));

            return collect($relationData)
                ->map(fn($relItem) => [$property => data_get($relItem, $property)])
                ->values()
                ->toArray();
        }

        return null;
    }

    /**
     * Localize item fields and return as plain array (for JSON response).
     */
    protected function localizeItemArray(Model $item): array
    {
        $itemArray = $item->toArray();

        foreach ($itemArray as $key => $value) {
            if ($this->isLocalizedField($item, $key)) {
                $itemArray[$key] = $this->decodeLocalizedValue($item->getRawOriginal($key));
            }
        }

        return $itemArray;
    }
}

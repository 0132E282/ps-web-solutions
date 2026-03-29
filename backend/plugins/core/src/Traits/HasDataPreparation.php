<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Http\Request;

/**
 * Trait for preparing request data.
 */
trait HasDataPreparation
{
    /**
     * Prepare request data by transforming and merging files.
     */
    protected function prepareRequestData(Request $request): array
    {
        $data = $this->autoTransformRequest($request->all());
        $data = $this->mergeNestedFields($data);

        $files = $request->allFiles();

        return ! empty($files) ? array_merge($data, $files) : $data;
    }

    /**
     * Merge nested dot-notation fields into parent arrays.
     * Example: "property.type" + "property.values" → property: { type, values }
     */
    protected function mergeNestedFields(array $data): array
    {
        $nestedGroups = [];
        $dotKeys = [];

        foreach ($data as $key => $value) {
            if (! str_contains($key, '.')) {
                continue;
            }

            [$parentKey, $childKey] = explode('.', $key, 2);

            $nestedGroups[$parentKey] ??= [];
            $this->setNestedValue($nestedGroups[$parentKey], $childKey, $value);
            $dotKeys[] = $key;
        }

        foreach ($dotKeys as $key) {
            unset($data[$key]);
        }

        foreach ($nestedGroups as $parentKey => $nestedData) {
            $data[$parentKey] = isset($data[$parentKey]) && is_array($data[$parentKey])
                ? array_merge($data[$parentKey], $nestedData)
                : $nestedData;
        }

        return $data;
    }

    /**
     * Set a deeply nested value in an array using dot notation.
     */
    protected function setNestedValue(array &$array, string $key, $value): void
    {
        if (! str_contains($key, '.')) {
            $array[$key] = $value;
            return;
        }

        $keys    = explode('.', $key);
        $current = &$array;

        foreach ($keys as $i => $k) {
            if ($i === count($keys) - 1) {
                $current[$k] = $value;
            } else {
                if (! isset($current[$k]) || ! is_array($current[$k])) {
                    $current[$k] = [];
                }
                $current = &$current[$k];
            }
        }
    }
}

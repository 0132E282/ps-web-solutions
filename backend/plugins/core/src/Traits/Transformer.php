<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use PS0132E282\Core\Cats\Localization;
use PS0132E282\Core\Cats\SlugField;

trait Transformer
{
    public function toArray()
    {
        $transformFields = $this->parseFieldTransforms();
        return $this->transformFields($transformFields);
    }

    public function toJson($options = 0)
    {
        return json_encode($this->toArray(), $options);
    }

    protected function parseFieldTransforms(): array
    {
        $fields = request()->query('fields', []);
        
        if (is_string($fields)) {
            $fields = array_filter(array_map('trim', explode(',', $fields)));
        }

        $transforms = [];
        foreach ($fields as $field) {
            $decoded = urldecode($field);
            if (Str::contains($decoded, '->')) {
                [$name, $option] = explode('->', $decoded, 2);
                $transforms[$name][] = $option;
            } else {
                $transforms[$field][] = true;
            }
        }

        return $transforms;
    }

    /**
     * Core transformation logic
     */
    protected function transformFields(array $transforms): array
    {
        $attributes = parent::toArray();
        $casts = $this->getCasts();

        // 1. Process localized attributes
        foreach ($attributes as $key => $value) {
            if ($this->shouldTransformLocalization($key, $casts)) {
                $this->applyLocalizationTransform($key, $transforms[$key] ?? [], $attributes);
            }
        }

        // 2. Process relations
        $this->transformRelations($transforms, $attributes);

        return $attributes;
    }

    /**
     * Check if a field should be localized
     */
    protected function shouldTransformLocalization(string $key, array $casts): bool
    {
        $cast = $casts[$key] ?? null;
        if (!$cast) return false;

        $targetClasses = [Localization::class, SlugField::class];
        foreach ($targetClasses as $class) {
            if ($cast === $class || is_subclass_of($cast, $class)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Apply localization logic for a specific field
     */
    protected function applyLocalizationTransform(string $key, array $fieldTransforms, array &$attributes): void
    {
        $rawData = $this->getRawLocalizationData($key);
        
        // * Determine if the base field (default locale) was explicitly requested or is the fallback
        $hasBaseField = in_array(true, $fieldTransforms, true);
        $options = array_filter($fieldTransforms, 'is_string');
        $hasTransformations = !empty($options);

        // * Strategy: If only ONE thing is requested, use the base key name
        $useBaseKeyAsOnlyOutput = !$hasBaseField && count($fieldTransforms) === 1;

        // 1. Process ->toRaw
        if (in_array('toRaw', $options)) {
            $keyName = ($useBaseKeyAsOnlyOutput) ? $key : "{$key}_raw";
            $attributes[$keyName] = $rawData;
        }

        // 2. Process locales (e.g. ->en)
        foreach ($options as $locale) {
            if ($locale === 'toRaw') continue;

            $keyName = ($useBaseKeyAsOnlyOutput) ? $key : "{$key}_{$locale}";
            $attributes[$keyName] = $rawData[$locale] ?? null;
        }

        // 3. Process base field (default locale)
        if ($hasBaseField || !$hasTransformations) {
            $locale = current_locale();
            $attributes[$key] = $rawData[$locale] ?? reset($rawData) ?: '';
        } elseif (!$useBaseKeyAsOnlyOutput) {
            // * Remove the casted default if specific transformations were requested 
            // * and they didn't overwrite the base key
            unset($attributes[$key]);
        }
    }

    /**
     * Get and decode raw data for localization
     */
    protected function getRawLocalizationData(string $key): array
    {
        $rawData = $this->getRawOriginal($key);
        if (is_string($rawData)) {
            return json_decode($rawData, true) ?: [];
        }
        return is_array($rawData) ? $rawData : [];
    }

    /**
     * Process relations recursively
     */
    protected function transformRelations(array $transforms, array &$attributes): void
    {
        foreach ($this->getRelations() as $key => $relation) {
            $relationTransforms = $this->extractRelationTransforms($transforms, $key);

            if ($relation instanceof Model && method_exists($relation, 'transformFields')) {
                $attributes[$key] = $relation->transformFields($relationTransforms);
            } elseif ($relation instanceof \Illuminate\Support\Collection) {
                $attributes[$key] = $relation->map(function ($item) use ($relationTransforms) {
                    return ($item instanceof Model && method_exists($item, 'transformFields'))
                        ? $item->transformFields($relationTransforms)
                        : $item;
                })->toArray();
            }
        }
    }

    /**
     * Extract transformations for a specific relation
     */
    protected function extractRelationTransforms(array $transforms, string $relation): array
    {
        $result = [];
        foreach ($transforms as $field => $options) {
            if (Str::startsWith($field, "{$relation}.")) {
                $nestedField = substr($field, strlen($relation) + 1);
                $result[$nestedField] = $options;
            }
        }
        return $result;
    }
}

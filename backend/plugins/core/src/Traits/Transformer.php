<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

trait Transformer
{
    /**
     * Transform the model instance to an array.
     */
    public function toArray()
    {
        $transformFields = $this->parseFieldTransforms();
        return $this->transformFields($transformFields);
    }

    /**
     * Transform the model instance to JSON.
     */
    public function toJson($options = 0)
    {
        return json_encode($this->toArray(), $options);
    }

    /**
     * Parse field transformations from the request.
     */
    protected function parseFieldTransforms(): array
    {
        $fields = request()->query('fields', []);
        if (is_string($fields)) {
            $fields = array_map('trim', explode(',', $fields));
        }

        $transforms = [];
        foreach ($fields as $field) {
            $decodedField = urldecode($field);
            if (Str::contains($decodedField, '->')) {
                [$fieldName, $option] = explode('->', $decodedField, 2);
                $transforms[$fieldName][] = $option;
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
        $relations = $this->getRelations();

        // Support for multilingual fields through Localization cast
        $casts = $this->getCasts();
        
        foreach ($attributes as $key => $value) {
            // Check if field is localized
            $isLocalized = isset($casts[$key]) && 
                ($casts[$key] === \PS0132E282\Core\Cats\Localization::class || 
                 is_subclass_of($casts[$key], \PS0132E282\Core\Cats\Localization::class));

            if ($isLocalized) {
                $rawData = $this->getRawOriginal($key);
                if (is_string($rawData)) {
                    $rawData = json_decode($rawData, true) ?: [];
                }

                $fieldTransforms = $transforms[$key] ?? [];

                // 1. If ->toRaw requested
                if (in_array('toRaw', $fieldTransforms)) {
                    $attributes[$key] = $rawData;
                    continue;
                }

                // 2. If specific locales requested (e.g., name->en, name->vi)
                $hasLocaleRequest = false;
                foreach ($fieldTransforms as $option) {
                    if (is_string($option) && $option !== 'toRaw') {
                        $attributes["{$key}->{$option}"] = $rawData[$option] ?? null;
                        $hasLocaleRequest = true;
                    }
                }

                if ($hasLocaleRequest) {
                    unset($attributes[$key]);
                }
                // 3. Default behavior: Localization cast already translated it in parent::toArray()
                // So we don't need to do anything if no special transform requested.
            }
        }

        // Recursive transformation for relations
        foreach ($relations as $key => $relation) {
            $relationTransforms = $this->extractRelationTransforms($transforms, $key);
            
            if ($relation instanceof Model) {
                if (method_exists($relation, 'transformFields')) {
                    $attributes[$key] = $relation->transformFields($relationTransforms);
                }
            } elseif ($relation instanceof \Illuminate\Support\Collection) {
                $attributes[$key] = $relation->map(function ($item) use ($relationTransforms) {
                    if ($item instanceof Model && method_exists($item, 'transformFields')) {
                        return $item->transformFields($relationTransforms);
                    }
                    return $item;
                })->toArray();
            }
        }

        return $attributes;
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

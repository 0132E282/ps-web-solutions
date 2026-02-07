<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Http\Request;
use PS0132E282\Core\Base\Resource;

trait HasDuplication
{
    /**
     * Duplicate an existing item
     * Creates a copy of the item with all its relationships
     */
    public function duplicate($id, Request $request)
    {
        $item = $this->model::query()->findOrFail($id);

        $validRelationships = $this->loadRelationshipsForDuplication($item);
        $attributes = $this->prepareDuplicateAttributes($item);

        $newItem = $this->model::query()->create($attributes);

        $this->duplicateRelationships($item, $newItem, $validRelationships);

        if (request()->wantsJson()) {
            return Resource::item($newItem);
        }

        return redirect()->route($this->getRouteName('index'))
            ->with('success', 'Nhân bản thành công');
    }

    protected function loadRelationshipsForDuplication($item): array
    {
        $formRelationships = $this->getFormRelationships();
        if (empty($formRelationships)) {
            return [];
        }

        $validRelationships = $this->validateRelationships($formRelationships);
        if (! empty($validRelationships)) {
            $item->load($validRelationships);
        }

        return $validRelationships;
    }

    protected function prepareDuplicateAttributes($item): array
    {
        $attributes = $item->getAttributes();
        $baseExcludedInfo = ['id', 'created_at', 'updated_at', 'deleted_at'];

        foreach ($baseExcludedInfo as $key) {
            unset($attributes[$key]);
        }

        $copyTranslations = array_fill_keys($this->getAvailableLocales(), 'Copy');

        if (isset($attributes['slug'])) {
            $attributes['slug'] = $this->processLocalizedCopy($item, 'slug', $attributes['slug'], $copyTranslations, '-copy');
        }

        foreach (['title', 'name'] as $field) {
            if (isset($attributes[$field])) {
                $attributes[$field] = $this->processLocalizedCopy($item, $field, $attributes[$field], $copyTranslations);
            }
        }

        return $attributes;
    }

    protected function processLocalizedCopy($item, string $field, $value, array $translations, string $suffix = '')
    {
        $isLocalized = $this->isLocalizedField($item, $field);

        if ($isLocalized) {
            $localizedValue = $this->decodeLocalizedValue($value);

            if (is_array($localizedValue)) {
                foreach ($localizedValue as $locale => $val) {
                    if (is_string($val)) {
                        $copyText = $translations[$locale] ?? 'Copy';
                        $localizedValue[$locale] = $suffix
                            ? $val.$suffix
                            : $this->addCopySuffix($val, $copyText);
                    }
                }

                return $localizedValue;
            } elseif (is_string($value)) {
                $copyText = $translations[app()->getLocale()] ?? 'Copy';

                return $suffix ? $value.$suffix : $this->addCopySuffix($value, $copyText);
            }
        } else {
            if (is_string($value)) {
                $copyText = $translations[app()->getLocale()] ?? 'Copy';

                return $suffix ? $value.$suffix : $this->addCopySuffix($value, $copyText);
            } elseif (is_array($value)) {
                foreach ($value as $k => $v) {
                    if (is_string($v)) {
                        $copyText = $translations[$k] ?? 'Copy';
                        $value[$k] = $suffix ? $v.$suffix : $this->addCopySuffix($v, $copyText);
                    }
                }

                return $value;
            }
        }

        return $value;
    }

    protected function duplicateRelationships($originalItem, $newItem, array $validRelationships): void
    {
        if (empty($validRelationships)) {
            return;
        }

        $relationshipsData = [];
        foreach ($validRelationships as $relationName) {
            if (! $originalItem->relationLoaded($relationName)) {
                continue;
            }

            $relation = $originalItem->$relationName;
            if ($relation instanceof \Illuminate\Database\Eloquent\Relations\BelongsToMany) {
                $relationshipsData[$relationName] = $originalItem->$relationName()->pluck('id')->toArray();
            } elseif ($relation instanceof \Illuminate\Database\Eloquent\Relations\BelongsTo) {
                $foreignKey = $originalItem->$relationName()->getForeignKeyName();
                $relationshipsData[$relationName] = $originalItem->$foreignKey;
            }
        }

        if (! empty($relationshipsData)) {
            $this->syncRelationships($newItem, $relationshipsData);
        }

        $newItem->load($validRelationships);
    }

    /**
     * Add copy suffix to a value, incrementing number if already has copy suffix
     */
    protected function addCopySuffix(string $value, string $copyText): string
    {
        $pattern = '/\s*\(('.preg_quote($copyText, '/').')(\s+(\d+))?\)\s*$/i';

        if (preg_match($pattern, $value, $matches)) {
            $currentNumber = isset($matches[3]) && is_numeric($matches[3]) ? (int) $matches[3] : 1;
            $nextNumber = $currentNumber + 1;

            $baseValue = preg_replace($pattern, '', $value);

            return $baseValue.' ('.$copyText.' '.$nextNumber.')';
        }

        return $value.' ('.$copyText.')';
    }
}

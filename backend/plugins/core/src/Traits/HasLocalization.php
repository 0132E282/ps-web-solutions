<?php

namespace PS0132E282\Core\Traits;

trait HasLocalization
{
    /**
     * Get available locales from config or default
     */
    protected function getAvailableLocales(): array
    {
        $locales = config('app.available_locales');

        if (is_array($locales) && ! empty($locales)) {
            return $locales;
        }

        return ['en', 'vi'];
    }

    /**
     * Check if a field uses Localization cast
     */
    protected function isLocalizedField($model, string $field): bool
    {
        if (! $this->hasModel()) {
            return false;
        }

        $casts = $model->getCasts();
        if (! isset($casts[$field])) {
            return false;
        }

        $cast = $casts[$field];

        return $cast === \PS0132E282\Core\Cats\Localization::class
            || is_subclass_of($cast, \PS0132E282\Core\Cats\Localization::class);
    }

    /**
     * Decode localized value from JSON string to array
     */
    protected function decodeLocalizedValue($value)
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }

            return $value;
        }

        return $value;
    }
}

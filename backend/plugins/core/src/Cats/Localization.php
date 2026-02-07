<?php

namespace PS0132E282\Core\Cats;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Spatie\Translatable\Translatable;

class Localization implements CastsAttributes
{
    /**
     * Get available locales from config or scan lang directory.
     */
    protected function getAvailableLocales(): array
    {
        // Try to get from config first
        $locales = config('app.available_locales');

        if (is_array($locales) && ! empty($locales)) {
            return $locales;
        }

        // Scan lang directory for available locales
        $langPath = base_path('lang');
        if (is_dir($langPath)) {
            $locales = array_filter(scandir($langPath), function ($item) use ($langPath) {
                return is_dir($langPath.'/'.$item) && ! in_array($item, ['.', '..']);
            });

            if (! empty($locales)) {
                return array_values($locales);
            }
        }

        // Fallback to default locales
        return ['en', 'vi'];
    }

    /**
     * Get translatable config instance.
     */
    protected function getTranslatableConfig(): Translatable
    {
        return app(Translatable::class);
    }

    /**
     * Transform the attribute from the underlying model values.
     * Compatible with spatie/laravel-translatable format.
     *
     * @return array
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): string
    {
        if (is_null($value) || $value === '') {
            return '';
        }

        $locale = current_locale();
        $decoded = null;

        // If value is already an array
        if (is_array($value)) {
            $decoded = $value;
        }
        // If value is a string, try to decode JSON
        elseif (is_string($value)) {
            $decoded = json_decode($value, true);
            // If decoding failed, treat as plain string
            if (! is_array($decoded)) {
                return $value;
            }
        }
        // For other types, convert to string
        else {
            return (string) $value;
        }

        if (isset($decoded[$locale])) {
            return (string) $decoded[$locale];
        }

        // If not found, get first available value
        $firstValue = reset($decoded);

        return $firstValue !== false ? (string) $firstValue : '';
    }

    /**
     * Transform the attribute to its underlying model values.
     * Compatible with spatie/laravel-translatable format and supports ?locale=vi parameter.
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        $availableLocales = $this->getAvailableLocales();
        $currentLocale = current_locale();

        // Get existing value from attributes (compatible with spatie/laravel-translatable format)
        $existingValue = [];
        if (isset($attributes[$key]) && ! empty($attributes[$key])) {
            $decoded = is_string($attributes[$key])
                ? json_decode($attributes[$key], true)
                : $attributes[$key];

            if (is_array($decoded)) {
                $existingValue = $decoded;
            }
        }

        // If value is null or empty, return existing value or empty JSON object
        if (is_null($value) || (is_array($value) && empty($value))) {
            return ! empty($existingValue)
                ? $this->encodeJson($existingValue)
                : $this->encodeJson([]);
        }

        // If value is already a JSON string, validate and merge with existing
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                // If current locale is set in request (?locale=vi), only update that locale
                if ($currentLocale && in_array($currentLocale, $availableLocales, true) && isset($decoded[$currentLocale])) {
                    $existingValue[$currentLocale] = $decoded[$currentLocale];

                    return $this->encodeJson($existingValue);
                }

                // Otherwise merge all locales from decoded value
                return $this->encodeJson(array_merge($existingValue, $decoded));
            }

            // If it's a string but not valid JSON, treat it as a single value
            // Update only current locale if set (?locale=vi), otherwise update all locales
            if ($currentLocale && in_array($currentLocale, $availableLocales, true)) {
                $existingValue[$currentLocale] = $value;

                return $this->encodeJson($existingValue);
            }

            // Create for all locales (compatible with spatie/laravel-translatable default behavior)
            $localized = [];
            foreach ($availableLocales as $locale) {
                $localized[$locale] = $value;
            }

            return $this->encodeJson(array_merge($existingValue, $localized));
        }

        // If value is an array
        if (is_array($value)) {
            // Check if array is already in localization format (has locale keys)
            $hasLocaleKeys = false;
            foreach ($availableLocales as $locale) {
                if (isset($value[$locale])) {
                    $hasLocaleKeys = true;
                    break;
                }
            }

            if ($hasLocaleKeys) {
                // If current locale is set (?locale=vi), only update that locale
                if ($currentLocale && isset($value[$currentLocale])) {
                    $existingValue[$currentLocale] = $value[$currentLocale];

                    return $this->encodeJson($existingValue);
                }

                // Otherwise merge all locale keys (compatible with spatie/laravel-translatable setTranslations)
                return $this->encodeJson(array_merge($existingValue, $value));
            }

            // If array has numeric keys or other structure
            // If current locale is set, use first value for that locale only
            if ($currentLocale && in_array($currentLocale, $availableLocales, true)) {
                $firstValue = reset($value);
                $existingValue[$currentLocale] = $firstValue;

                return $this->encodeJson($existingValue);
            }

            // Otherwise create for all locales using first value
            $firstValue = reset($value);
            $localized = [];
            foreach ($availableLocales as $locale) {
                $localized[$locale] = $firstValue;
            }

            return $this->encodeJson(array_merge($existingValue, $localized));
        }

        // For other types (string, number, etc.)
        // If current locale is set (?locale=vi), only update that locale
        if ($currentLocale && in_array($currentLocale, $availableLocales, true)) {
            $existingValue[$currentLocale] = $value;

            return $this->encodeJson($existingValue);
        }

        // Otherwise create for all locales (compatible with spatie/laravel-translatable)
        $localized = [];
        foreach ($availableLocales as $locale) {
            $localized[$locale] = $value;
        }

        return $this->encodeJson(array_merge($existingValue, $localized));
    }

    /**
     * Encode array to JSON string (compatible with spatie/laravel-translatable format).
     */
    protected function encodeJson(array $value): string
    {
        // Use same encoding flags as spatie/laravel-translatable
        return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
